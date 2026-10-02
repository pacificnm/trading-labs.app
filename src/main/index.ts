import { app, BrowserWindow, dialog, ipcMain, Menu, safeStorage, shell } from 'electron'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { getDb } from './db'
import { registerChat } from './chat'
import { registerFmp } from './fmp'
import { makeFmpMcp } from './fmpMcp'
import { makeSecrets } from './secrets'
import { createEngine } from './trading'
import { createJournal } from './journal'
import { createStrategies } from './strategies'
import { createOptionsClient } from './options'
import { isMarketOpen } from '../shared/nytime'
import { createWatchlists } from './watchlists'
import { createAccounts } from './accounts'
import { createUpdates, githubSlug } from './updates'
import { createPortfolio } from './portfolio'
import { placePortfolioOrders } from './portfolioOrders'
import { createBackup, fileSize, inspectBackup, restoreBackup } from './backup'

// One data folder whatever this build is called (dev run, unpacked folder, AppImage or .deb), so the
// database and saved keys are shared between them.
app.setPath('userData', process.env['TRADING_DATA_DIR'] || join(app.getPath('appData'), 'trading-lab')) // TRADING_DATA_DIR: use a scratch folder (tests)

if (process.platform === 'linux') {
  // Electron can't identify some Linux desktops (e.g. labwc) and then silently skips the keyring,
  // which disables safeStorage. The secret service (gnome-keyring) is what we want on Linux.
  app.commandLine.appendSwitch('password-store', 'gnome-libsecret')
  // Chromium's sandbox needs a root-owned SUID helper or unprivileged user namespaces. A portable
  // AppImage or plain folder can't provide the first and many systems (this Pi included) block the second,
  // so without this the app exits at start-up. Set TRADING_SANDBOX=1 to keep the sandbox where it works.
  if (app.isPackaged && !process.env['TRADING_SANDBOX']) app.commandLine.appendSwitch('no-sandbox')
}

if (process.env['TRADING_NO_GPU']) app.disableHardwareAcceleration()

// `trading-lab --screenshot=/tmp/shot.png [--view="Account"] [--wait=4000]` renders the real UI in a hidden window,
// optionally opens a ribbon screen by its tooltip, saves a PNG and exits (used to check builds without a display session).
const argValue = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const shotPath = argValue('screenshot')
// --size=1500x1080 sets the window size (handy for long screens; the display caps the height)
const [winW, winH] = (argValue('size') ?? '1500x900').split('x').map((n) => Math.max(400, Number(n) || 0))

function createWindow(): void {
  const win = new BrowserWindow({
    width: winW || 1500,
    height: winH || 900,
    show: !shotPath,
    backgroundColor: '#1e1e1e',
    title: 'Trading Lab',
    icon: join(app.getAppPath(), 'build/icon.png'),
    frame: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: !shotPath
    }
  })
  win.on('maximize', () => win.webContents.send('win:maximized', true))
  win.on('unmaximize', () => win.webContents.send('win:maximized', false))
  if (shotPath) {
    win.webContents.once('did-finish-load', async () => {
      try {
        await new Promise((r) => setTimeout(r, Number(argValue('settle') ?? 1500))) // --settle=5000 waits longer before the clicks (slow screens)
        const view = argValue('view')
        if (view) await win.webContents.executeJavaScript(`(() => { const b = [...document.querySelectorAll('[title]')].find((e) => e.getAttribute('title') === ${JSON.stringify(view)}); if (b) b.click(); return !!b })()`)
        if (argValue('lag')) await new Promise((r) => setTimeout(r, Number(argValue('lag')))) // --lag=4000: let the screen load before the clicks
        // --click="About|About Trading Lab…" clicks buttons by their text, in order (e.g. to open a menu item)
        // --enter="Search symbol…=app" types into the input with that placeholder (after the clicks below)
        const typed = argValue('enter')
        for (const label of (argValue('click') ?? '').split('|').filter(Boolean)) {
          await win.webContents.executeJavaScript(`(() => { const b = [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === ${JSON.stringify(label)} || e.getAttribute('title') === ${JSON.stringify(label)}); if (b) b.click(); return !!b })()`)
          await new Promise((r) => setTimeout(r, 600))
        }
        // --field="Order type=limit|Limit price=183" sets order-ticket style fields: the control right after the label with that text
        for (const f of (argValue('field') ?? '').split('|').filter(Boolean)) {
          if (f.startsWith('type:')) { // types into the input with that placeholder, e.g. "type:Search symbol…=app"
            const [ph, ...v2] = f.slice(5).split('=')
            await win.webContents.executeJavaScript(`(() => { const i = [...document.querySelectorAll('input')].find((e) => e.placeholder === ${JSON.stringify(ph)}); if (!i) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, ${JSON.stringify(v2.join('='))}); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
            await new Promise((r) => setTimeout(r, 400))
            continue
          }
          if (f.startsWith('text:')) { // clicks the smallest element that contains this text, e.g. a list row: "text:NVDA pullback"
            await win.webContents.executeJavaScript(`(() => { const t = ${JSON.stringify(f.slice(5))}; const all = [...document.querySelectorAll('body *')].filter((e) => e.textContent.includes(t) && ![...e.children].some((c) => c.textContent.includes(t))); const el = all[0]; if (el) el.click(); return !!el })()`)
            await new Promise((r) => setTimeout(r, 600))
            continue
          }
          if (f.startsWith('check:')) { // toggles the checkbox inside the label with that text, e.g. "check:Greeks"
            await win.webContents.executeJavaScript(`(() => { const l = [...document.querySelectorAll('label')].find((e) => e.textContent.trim() === ${JSON.stringify(f.slice(6))}); const i = l && l.querySelector('input[type=checkbox]'); if (i) i.click(); return !!i })()`)
            await new Promise((r) => setTimeout(r, 400))
            continue
          }
          if (f.startsWith('click:')) { // a button press in between fields, e.g. "click:+5%"
            await win.webContents.executeJavaScript(`(() => { const b = [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === ${JSON.stringify(f.slice(6))} || e.getAttribute('title') === ${JSON.stringify(f.slice(6))}); if (b) b.click(); return !!b })()`)
            await new Promise((r) => setTimeout(r, 400))
            continue
          }
          const [label, ...v] = f.split('=')
          await win.webContents.executeJavaScript(`(() => { const l = [...document.querySelectorAll('label')].find((e) => e.textContent.trim() === ${JSON.stringify(label)}); const n = l && l.nextElementSibling; const c = n && (n.matches('input,select,textarea') ? n : n.querySelector('input,select,textarea')); if (!c) return false; const proto = c.tagName === 'SELECT' ? HTMLSelectElement : c.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement; Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(c, ${JSON.stringify(v.join('='))}); c.dispatchEvent(new Event(c.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); return true })()`)
          await new Promise((r) => setTimeout(r, 400))
        }
        if (typed) {
          const [ph, ...rest] = typed.split('=')
          await win.webContents.executeJavaScript(`(() => { const i = [...document.querySelectorAll('input')].find((e) => e.placeholder === ${JSON.stringify(ph)}); if (!i) return false; i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, ${JSON.stringify(rest.join('='))}); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
        }
        await new Promise((r) => setTimeout(r, Number(argValue('wait') ?? 4000)))
        // --hide=".card-grid" hides matching elements so what is below them fits in the shot
        if (argValue('hide')) { await win.webContents.insertCSS(`${argValue('hide')} { display: none !important }`); await new Promise((r) => setTimeout(r, 600)) }
        // --tool='[{"name":"prepare_order","input":{...}}]' runs Claude tools in the renderer exactly as a chat would (no API call), to show their results
        if (argValue('tool')) {
          const calls = JSON.parse(argValue('tool')!) as { name: string; input: unknown }[]
          for (const [i, c] of calls.entries()) { win.webContents.send('tool:call', { callId: `shot-${i}`, name: c.name, input: c.input }); await new Promise((r) => setTimeout(r, 2500)) }
        }
        // --zoom=0.8 shrinks the page so a long screen fits in one shot (use with --size)
        if (argValue('zoom')) { win.webContents.setZoomFactor(Number(argValue('zoom')) || 1); await new Promise((r) => setTimeout(r, 1500)) }
        const errors = await win.webContents.executeJavaScript('document.querySelector(".app") ? "ok" : "NO APP ROOT"')
        const img = await win.webContents.capturePage()
        mkdirSync(dirname(shotPath), { recursive: true })
        writeFileSync(shotPath, img.toPNG())
        console.log(`screenshot ${shotPath} (${img.getSize().width}x${img.getSize().height}) render: ${errors}${view ? ` view: ${view}` : ''}`)
        app.exit(0)
      } catch (e) { console.error(`screenshot failed: ${(e as Error).message}`); app.exit(1) }
    })
  }
  if (process.env['ELECTRON_RENDERER_URL']) win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else win.loadFile(join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  // our own title bar replaces the menu everywhere except macOS, where the menu bar is also what carries Cmd+C/V/Q
  Menu.setApplicationMenu(process.platform === 'darwin' ? Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }]) : null)
  const db = getDb()

  // `trading-lab --self-test` checks the install without opening a window (used to verify packaged builds)
  if (process.argv.includes('--self-test')) {
    const probe = makeSecrets(db)
    const key = (name: string) => { try { return probe.get(name) ? 'stored and readable' : 'not stored' } catch (e) { return `STORED BUT CANNOT BE DECRYPTED (${(e as Error).message})` } }
    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[]).map((t) => t.name)
    console.log(JSON.stringify({
      app: app.getName(), version: app.getVersion(), packaged: app.isPackaged, electron: process.versions.electron, node: process.versions.node, chromium: process.versions.chrome,
      arch: process.arch, userData: app.getPath('userData'), rendererPresent: existsSync(join(__dirname, '../renderer/index.html')), preloadPresent: existsSync(join(__dirname, '../preload/index.js')),
      database: { tables: tables.length, has: ['accounts', 'orders', 'fills', 'positions', 'journal_entries', 'strategy_docs'].filter((t) => tables.includes(t)) },
      keyring: { available: safeStorage.isEncryptionAvailable(), backend: safeStorage.getSelectedStorageBackend?.() },
      savedKeys: { fmp: key('fmp_key'), anthropic: key('anthropic_key') }
    }, null, 2))
    app.exit(0)
    return
  }
  const secrets = makeSecrets(db)
  const mcp = makeFmpMcp(secrets)
  registerChat(db, secrets, mcp)
  const fmpApi = registerFmp(secrets, db)
  const accounts = createAccounts(db)
  const engine = createEngine(db, { quote: (s) => fmpApi.quote(s), bars: (s, from) => fmpApi.barsFine(s, from), grain: fmpApi.grain }, undefined, accounts.activeId)
  const broadcast = (events: { text: string }[] = []) => BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('trade:update', events))
  const guard = async <T>(fn: () => Promise<T>) => { try { return await fn() } catch (e) { return { ok: false as const, errors: [(e as Error).message] } } }
  ipcMain.handle('trade:snapshot', () => engine.snapshot())
  ipcMain.handle('trade:place', (_e, spec) => guard(async () => { const r = await engine.place(spec); broadcast(r.ok ? r.events : []); return r }))
  ipcMain.handle('trade:cancel', (_e, id: number) => guard(async () => { const r = engine.cancel(id); broadcast(); return r }))
  ipcMain.handle('trade:modify', (_e, id: number, patch) => guard(async () => { const r = engine.modify(id, patch); broadcast(); return r }))
  ipcMain.handle('trade:close', (_e, symbol: string) => guard(async () => { const r = await engine.closePosition(symbol); broadcast(); return r }))
  ipcMain.handle('trade:reset', (_e, cash: number) => { engine.reset(cash); broadcast() })
  // paper accounts: one is active at a time (new orders go there), but working orders in every account keep filling
  const acct = <T>(fn: () => T | Promise<T>) => async () => { try { const data = await fn(); broadcast(); return { ok: true as const, data } } catch (e) { return { ok: false as const, error: (e as Error).message } } }
  ipcMain.handle('acct:list', async (_e, withEquity?: boolean) => {
    const list = accounts.list()
    if (withEquity) await Promise.all(list.map(async (a) => { a.equity = await engine.values(a.id).then((v) => v.equity).catch(() => undefined) }))
    return { list, activeId: accounts.activeId() }
  })
  ipcMain.handle('acct:transfers', (_e, id: number) => accounts.transfers(id))
  ipcMain.handle('acct:create', (_e, input, balance: number) => acct(() => accounts.create(input, balance))())
  ipcMain.handle('acct:update', (_e, id: number, patch) => acct(() => accounts.update(id, patch))())
  ipcMain.handle('acct:setBalance', (_e, id: number, cash: number, note?: string) => acct(() => accounts.setBalance(id, cash, note))())
  ipcMain.handle('acct:setActive', (_e, id: number) => acct(() => { accounts.setActive(id) })())
  ipcMain.handle('acct:remove', (_e, id: number) => acct(() => { accounts.remove(id) })())
  const wl = createWatchlists(db)
  const wlChanged = <T>(v: T): T => { BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('watchlists:changed')); return v }
  ipcMain.handle('wl:lists', () => wl.lists())
  ipcMain.handle('wl:create', (_e, name: string) => wlChanged(wl.create(name)))
  ipcMain.handle('wl:rename', (_e, id: number, name: string) => wlChanged(wl.rename(id, name)))
  ipcMain.handle('wl:delete', (_e, id: number) => wlChanged(wl.remove(id)))
  ipcMain.handle('wl:add', (_e, id: number, symbol: string) => wlChanged(wl.add(id, symbol)))
  ipcMain.handle('wl:remove', (_e, id: number, symbol: string) => wlChanged(wl.removeSymbol(id, symbol)))
  // Portfolio: planned allocations and holdings. Bookkeeping only; nothing here places an order.
  const portfolio = createPortfolio(db)
  const pfChanged = <T>(v: T): T => { BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('portfolio:changed')); return v }
  ipcMain.handle('pf:list', () => portfolio.list())
  ipcMain.handle('pf:create', (_e, name: string, amount?: number) => pfChanged(portfolio.create(name, amount)))
  ipcMain.handle('pf:update', (_e, id: number, patch: Parameters<typeof portfolio.update>[1]) => pfChanged(portfolio.update(id, patch)))
  ipcMain.handle('pf:remove', (_e, id: number) => pfChanged(portfolio.remove(id)))
  ipcMain.handle('pf:addItem', (_e, pid: number, input: Parameters<typeof portfolio.addItem>[1]) => pfChanged(portfolio.addItem(pid, input)))
  ipcMain.handle('pf:updateItem', (_e, id: number, patch: Parameters<typeof portfolio.updateItem>[1]) => pfChanged(portfolio.updateItem(id, patch)))
  ipcMain.handle('pf:removeItem', (_e, id: number) => pfChanged(portfolio.removeItem(id)))
  ipcMain.handle('pf:setTargets', (_e, pid: number, targets: { id: number; pct: number }[]) => pfChanged(portfolio.setTargets(pid, targets)))
  // a linked portfolio follows one paper account: its balances and positions, read without switching to it
  ipcMain.handle('pf:accountView', async (_e, accountId: number) => { try { return { ok: true as const, data: await engine.view(accountId) } } catch (e) { return { ok: false as const, error: (e as Error).message } } })
  // the two buttons that send paper orders from this screen (buy the plan, sell a percentage); the guards live in portfolioOrders.ts
  ipcMain.handle('pf:placeOrders', async (_e, pid: number, side: 'buy' | 'sell', orders: { symbol: string; qty: number }[]) => {
    const r = await placePortfolioOrders({ portfolio: (id) => portfolio.get(id), activeAccountId: () => accounts.activeId(), place: (spec) => engine.place(spec) }, pid, side, orders)
    broadcast(r.ok ? r.events : [])
    return pfChanged(r)
  })
  ipcMain.handle('pf:recordSells', (_e, pid: number, sells: { id: number; shares: number }[]) => pfChanged(portfolio.recordSells(pid, sells)))
  ipcMain.handle('pf:recordBuys', (_e, pid: number, buys: { id: number; shares: number; price: number }[]) => pfChanged(portfolio.recordBuys(pid, buys)))
  // options chains come from Cboe's public delayed feed (FMP has no options data)
  const optionsChain = createOptionsClient()
  ipcMain.handle('options:chain', async (_e, symbol: string, force?: boolean) => {
    try { return { ok: true, data: await optionsChain(symbol, { force, ttlMs: isMarketOpen(Date.now() / 1000) ? 60_000 : 15 * 60_000 }) } }
    catch (e) { return { ok: false, error: (e as Error).message } }
  })
  const strat = createStrategies(db)
  const stratChanged = <T>(v: T): T => { BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('strategies:changed')); return v }
  ipcMain.handle('strat:list', () => strat.list())
  ipcMain.handle('strat:create', (_e, input) => stratChanged(strat.create(input)))
  ipcMain.handle('strat:update', (_e, id: string, patch) => stratChanged(strat.update(id, patch)))
  ipcMain.handle('strat:delete', (_e, id: string) => { strat.remove(id); stratChanged(null) })
  ipcMain.handle('strat:progress', () => strat.progress())
  ipcMain.handle('strat:setProgress', (_e, id: string, p) => stratChanged(strat.setProgress(id, p)))
  const journal = createJournal(db)
  const changed = <T>(v: T): T => { BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('journal:changed')); return v }
  ipcMain.handle('journal:list', (_e, f) => journal.list(f))
  ipcMain.handle('journal:get', (_e, id: number) => journal.get(id))
  ipcMain.handle('journal:image', (_e, id: number) => journal.image(id))
  ipcMain.handle('journal:create', (_e, input) => changed(journal.create(input)))
  ipcMain.handle('journal:update', (_e, id: number, patch) => changed(journal.update(id, patch)))
  ipcMain.handle('journal:comment', (_e, id: number, c) => changed(journal.comment(id, c)))
  ipcMain.handle('journal:delete', (_e, id: number) => { journal.remove(id); changed(null) })
  // working orders are checked against fresh 1-minute bars while the app is open
  setInterval(() => { engine.tick().then((ev) => { if (ev.length) broadcast(ev) }).catch(() => undefined) }, 15_000)
  setTimeout(() => { engine.tick().then((ev) => broadcast(ev)).catch(() => undefined) }, 3_000)
  ipcMain.handle('fmp:mcp:status', () => mcp.status())
  app.on('before-quit', () => { void mcp.close() })
  const win = (e: Electron.IpcMainInvokeEvent) => BrowserWindow.fromWebContents(e.sender)!
  ipcMain.handle('win:minimize', (e) => win(e).minimize())
  ipcMain.handle('win:toggleMaximize', (e) => (win(e).isMaximized() ? win(e).unmaximize() : win(e).maximize()))
  ipcMain.handle('settings:get', (_e, key: string) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    return row ? JSON.parse(row.value) : null
  })
  ipcMain.handle('settings:set', (_e, key: string, value: unknown) => {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value))
  })
  // article links open in the user's browser; only web URLs are allowed
  ipcMain.handle('app:openExternal', (_e, url: string) => {
    try { const u = new URL(url); if (u.protocol === 'https:' || u.protocol === 'http:') return shell.openExternal(u.toString()) } catch { /* ignore */ }
  })
  // version and build details for the About dialog; the repository link comes from package.json so nothing is hard-coded
  ipcMain.handle('app:about', () => {
    let pkg: { name?: string; description?: string; license?: string; author?: string | { name?: string }; repository?: string | { url?: string } } = {}
    try { pkg = JSON.parse(readFileSync(join(app.getAppPath(), 'package.json'), 'utf8')) } catch { /* keep defaults */ }
    const raw = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url ?? ''
    const short = /^([\w.-]+)\/([\w.-]+)$/.exec(raw) // npm shorthand "owner/repo" means GitHub
    const repo = (short ? `https://github.com/${short[1]}/${short[2]}` : raw.replace(/^git\+/, '').replace(/^git:\/\//, 'https://').replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '')).trim()
    return {
      name: 'Trading Lab', description: pkg.description ?? '', version: app.getVersion(), packaged: app.isPackaged, license: pkg.license ?? '',
      electron: process.versions.electron, chromium: process.versions.chrome, node: process.versions.node, platform: process.platform, arch: process.arch,
      dataFolder: app.getPath('userData'), repository: /^https?:\/\//.test(repo) ? repo : ''
    }
  })
  // File > Back up / Restore. Dialogs live here so the renderer never handles file paths or the database file.
  const dbFile = join(app.getPath('userData'), 'trading.db')
  const describe = (b: { accounts: number; orders: number; journal: number; watchlists: number; portfolios: number }) => `${b.accounts} account(s), ${b.orders} order(s), ${b.journal} journal entr${b.journal === 1 ? 'y' : 'ies'}, ${b.watchlists} watchlist(s), ${b.portfolios} portfolio(s)`
  ipcMain.handle('backup:create', async (e) => {
    const parent = win(e)
    const r = await dialog.showSaveDialog(parent, { title: 'Back up Trading Lab data', defaultPath: join(app.getPath('documents'), `trading-lab-backup-${new Date().toISOString().slice(0, 10)}.db`), filters: [{ name: 'Trading Lab backup', extensions: ['db'] }] })
    if (r.canceled || !r.filePath) return { ok: false, canceled: true }
    try {
      const sum = createBackup(db, r.filePath, app.getVersion())
      return { ok: true, path: r.filePath, size: fileSize(r.filePath), contents: describe(sum) }
    } catch (err) { return { ok: false, error: err instanceof Error ? err.message : String(err) } }
  })
  ipcMain.handle('backup:restore', async (e) => {
    const parent = win(e)
    const pick = await dialog.showOpenDialog(parent, { title: 'Restore Trading Lab data from a backup', properties: ['openFile'], filters: [{ name: 'Trading Lab backup', extensions: ['db'] }, { name: 'All files', extensions: ['*'] }] })
    if (pick.canceled || !pick.filePaths[0]) return { ok: false, canceled: true }
    const file = pick.filePaths[0]
    if (file === dbFile) return { ok: false, error: 'That is the live database. Choose a backup file.' }
    const info = inspectBackup(file, app.getVersion())
    if (!info.ok) return { ok: false, error: info.error }
    const made = info.summary.createdAt ? ` made ${new Date(info.summary.createdAt).toLocaleString()}` : ''
    const sure = await dialog.showMessageBox(parent, {
      type: 'warning', title: 'Restore backup', buttons: ['Restore and restart', 'Cancel'], defaultId: 1, cancelId: 1,
      message: 'Replace all current data with this backup?',
      detail: `Backup${made}:\n${describe(info.summary)}.\n\nEverything now in Trading Lab (accounts, orders, journal, watchlists, settings, chats) is replaced. A safety copy of the current data is saved first, and your API keys on this computer are kept. The app restarts when it is done.`
    })
    if (sure.response !== 0) return { ok: false, canceled: true }
    try {
      const { safetyCopy } = restoreBackup({ live: db, livePath: dbFile, backupPath: file, safetyDir: join(app.getPath('userData'), 'backups'), appVersion: app.getVersion() })
      console.log('restored backup; safety copy at', safetyCopy)
      app.relaunch()
      app.exit(0)
      return { ok: true }
    } catch (err) { return { ok: false, error: err instanceof Error ? err.message : String(err) } }
  })
  // update check against GitHub Releases: on a timer when the setting allows, and on demand from the About dialog
  const updateRepo = (() => {
    try { const p = JSON.parse(readFileSync(join(app.getAppPath(), 'package.json'), 'utf8')); return githubSlug(typeof p.repository === 'string' ? p.repository : p.repository?.url ?? '') } catch { return null }
  })()
  const checkUpdates = createUpdates({ fetch, current: app.getVersion(), slug: updateRepo, platform: process.platform, arch: process.arch, appImage: !!process.env['APPIMAGE'] })
  const autoUpdates = () => { try { const r = db.prepare('SELECT value FROM settings WHERE key = ?').get('autoUpdateCheck') as { value: string } | undefined; return r ? JSON.parse(r.value) !== false : true } catch { return true } }
  ipcMain.handle('update:check', () => checkUpdates())
  const autoCheck = async () => {
    if (!autoUpdates()) return
    const r = await checkUpdates()
    if (r.ok && r.available) BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('update:available', r))
  }
  // packaged builds only: a dev checkout is always "behind" its own tags. TRADING_UPDATE_CHECK=1 forces it for testing
  if (app.isPackaged || process.env['TRADING_UPDATE_CHECK']) { setTimeout(autoCheck, 20_000); setInterval(autoCheck, 24 * 3600 * 1000) }
  ipcMain.handle('app:quit', () => app.quit())
  ipcMain.handle('win:close', (e) => win(e).close())
  ipcMain.handle('win:isMaximized', (e) => win(e).isMaximized())
  createWindow()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
}).catch((e) => { process.stderr.write(`[fatal] start-up failed: ${(e as Error).stack ?? e}\n`); app.exit(1) })

app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
