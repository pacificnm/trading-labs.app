import { contextBridge, ipcRenderer } from 'electron'
import type { WatchList, WlResult } from '../shared/watchlists'
import type { AccountLink, Kind, Mode, Pf, PfResult } from '../shared/portfolio'
import type { JournalEditable, JournalFilter, JournalItem } from '../shared/journal'
import type { CustomDocInput, Progress, StrategyDoc, StrategyProgress } from '../shared/strategies'
import type { OptionsChain } from '../shared/options'
import type { OrderSpec, TradeResult, TradeSnapshot } from '../shared/trade'
import type { FmpCaps } from '../shared/fmpCaps'
import type { AccountInfo, AccountInput, Transfer } from '../shared/accounts'
import type { FmpScreener, FmpScreenerOptions, ScreenerQuery, FmpCongress, FmpMarket, NewsArticle, Bar, FmpAnalyst, FmpFundamentals, FmpInterval, FmpOverview, FmpResult, FmpSearchHit, FmpTestRow, Rec } from '../shared/fmp'
import type { ChatEvent, ChatSummary, KeyStatus, SendRequest, StoredMessage } from '../shared/chat'

type AcctResult<T> = { ok: true; data: T } | { ok: false; error: string }
const call = <T>(channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args) as Promise<FmpResult<T>>

const api = {
  strategies: {
    list: () => ipcRenderer.invoke('strat:list') as Promise<StrategyDoc[]>,
    create: (input: CustomDocInput) => ipcRenderer.invoke('strat:create', input) as Promise<StrategyDoc>,
    update: (id: string, patch: CustomDocInput) => ipcRenderer.invoke('strat:update', id, patch) as Promise<StrategyDoc | null>,
    remove: (id: string) => ipcRenderer.invoke('strat:delete', id) as Promise<void>,
    progress: () => ipcRenderer.invoke('strat:progress') as Promise<StrategyProgress[]>,
    setProgress: (id: string, p: { status?: Progress; note?: string; quiz_score?: number | null }) => ipcRenderer.invoke('strat:setProgress', id, p) as Promise<StrategyProgress>,
    onChanged: (cb: () => void) => {
      const h = () => cb()
      ipcRenderer.on('strategies:changed', h)
      return () => { ipcRenderer.removeListener('strategies:changed', h) }
    }
  },
  options: {
    chain: (symbol: string, force?: boolean) => ipcRenderer.invoke('options:chain', symbol, force) as Promise<{ ok: true; data: OptionsChain } | { ok: false; error: string }>
  },
  portfolio: {
    list: () => ipcRenderer.invoke('pf:list') as Promise<Pf[]>,
    create: (name: string, amount?: number) => ipcRenderer.invoke('pf:create', name, amount) as Promise<PfResult<{ id: number }>>,
    update: (id: number, patch: { name?: string; amount?: number; mode?: Mode; fractional?: boolean; leftover?: boolean; accountId?: number | null }) => ipcRenderer.invoke('pf:update', id, patch) as Promise<PfResult>,
    remove: (id: number) => ipcRenderer.invoke('pf:remove', id) as Promise<PfResult>,
    addItem: (pid: number, input: { symbol: string; name?: string; kind?: Kind }) => ipcRenderer.invoke('pf:addItem', pid, input) as Promise<PfResult<{ id: number; symbol: string }>>,
    updateItem: (id: number, patch: { targetPct?: number; shares?: number; cost?: number; manualPrice?: number | null; kind?: Kind; name?: string }) => ipcRenderer.invoke('pf:updateItem', id, patch) as Promise<PfResult>,
    removeItem: (id: number) => ipcRenderer.invoke('pf:removeItem', id) as Promise<PfResult>,
    setTargets: (pid: number, targets: { id: number; pct: number }[]) => ipcRenderer.invoke('pf:setTargets', pid, targets) as Promise<PfResult>,
    accountView: (accountId: number) => ipcRenderer.invoke('pf:accountView', accountId) as Promise<{ ok: true; data: AccountLink & { type: 'cash' | 'margin'; equity: number } } | { ok: false; error: string }>,
    placeOrders: (pid: number, side: 'buy' | 'sell', orders: { symbol: string; qty: number }[]) => ipcRenderer.invoke('pf:placeOrders', pid, side, orders) as Promise<{ ok: true; outcomes: { symbol: string; qty: number; ok: boolean; filledNow?: boolean; error?: string }[]; events: { text: string }[] } | { ok: false; error: string }>,
    recordSells: (pid: number, sells: { id: number; shares: number }[]) => ipcRenderer.invoke('pf:recordSells', pid, sells) as Promise<PfResult<{ recorded: number }>>,
    recordBuys: (pid: number, buys: { id: number; shares: number; price: number }[]) => ipcRenderer.invoke('pf:recordBuys', pid, buys) as Promise<PfResult<{ recorded: number }>>,
    onChanged: (cb: () => void) => {
      const h = () => cb()
      ipcRenderer.on('portfolio:changed', h)
      return () => { ipcRenderer.removeListener('portfolio:changed', h) }
    }
  },
  watchlists: {
    lists: () => ipcRenderer.invoke('wl:lists') as Promise<WatchList[]>,
    create: (name: string) => ipcRenderer.invoke('wl:create', name) as Promise<WlResult<{ id: number }>>,
    rename: (id: number, name: string) => ipcRenderer.invoke('wl:rename', id, name) as Promise<WlResult>,
    remove: (id: number) => ipcRenderer.invoke('wl:delete', id) as Promise<WlResult>,
    add: (id: number, symbol: string) => ipcRenderer.invoke('wl:add', id, symbol) as Promise<WlResult<{ symbol: string; added: boolean }>>,
    removeSymbol: (id: number, symbol: string) => ipcRenderer.invoke('wl:remove', id, symbol) as Promise<WlResult>,
    onChanged: (cb: () => void) => {
      const h = () => cb()
      ipcRenderer.on('watchlists:changed', h)
      return () => { ipcRenderer.removeListener('watchlists:changed', h) }
    }
  },
  journal: {
    list: (f?: JournalFilter) => ipcRenderer.invoke('journal:list', f) as Promise<JournalItem[]>,
    get: (id: number) => ipcRenderer.invoke('journal:get', id) as Promise<JournalItem | null>,
    image: (id: number) => ipcRenderer.invoke('journal:image', id) as Promise<string | null>,
    create: (input: JournalEditable & { source?: 'user' | 'claude' }) => ipcRenderer.invoke('journal:create', input) as Promise<JournalItem>,
    update: (id: number, patch: JournalEditable) => ipcRenderer.invoke('journal:update', id, patch) as Promise<JournalItem | null>,
    comment: (id: number, c: { by: 'user' | 'claude'; text: string }) => ipcRenderer.invoke('journal:comment', id, c) as Promise<JournalItem | null>,
    remove: (id: number) => ipcRenderer.invoke('journal:delete', id) as Promise<void>,
    onChanged: (cb: () => void) => {
      const h = () => cb()
      ipcRenderer.on('journal:changed', h)
      return () => { ipcRenderer.removeListener('journal:changed', h) }
    }
  },
  trade: {
    snapshot: () => ipcRenderer.invoke('trade:snapshot') as Promise<TradeSnapshot>,
    place: (spec: OrderSpec) => ipcRenderer.invoke('trade:place', spec) as Promise<TradeResult<{ orderIds: number[]; filledNow: boolean; events: { text: string }[] }>>,
    cancel: (id: number) => ipcRenderer.invoke('trade:cancel', id) as Promise<TradeResult>,
    modify: (id: number, patch: { limit?: number; stop?: number; qty?: number; trailAmount?: number }) => ipcRenderer.invoke('trade:modify', id, patch) as Promise<TradeResult>,
    close: (symbol: string) => ipcRenderer.invoke('trade:close', symbol) as Promise<TradeResult<{ orderIds: number[] }>>,
    reset: (cash: number) => ipcRenderer.invoke('trade:reset', cash) as Promise<void>,
    onUpdate: (cb: (events: { text: string }[]) => void) => {
      const h = (_: unknown, ev: { text: string }[]) => cb(ev)
      ipcRenderer.on('trade:update', h)
      return () => { ipcRenderer.removeListener('trade:update', h) }
    }
  },
  accounts: {
    list: (withEquity = false) => ipcRenderer.invoke('acct:list', withEquity) as Promise<{ list: AccountInfo[]; activeId: number }>,
    transfers: (id: number) => ipcRenderer.invoke('acct:transfers', id) as Promise<Transfer[]>,
    create: (input: AccountInput, balance: number) => ipcRenderer.invoke('acct:create', input, balance) as Promise<AcctResult<AccountInfo>>,
    update: (id: number, patch: Partial<AccountInput>) => ipcRenderer.invoke('acct:update', id, patch) as Promise<AcctResult<AccountInfo>>,
    setBalance: (id: number, cash: number, note?: string) => ipcRenderer.invoke('acct:setBalance', id, cash, note) as Promise<AcctResult<AccountInfo>>,
    setActive: (id: number) => ipcRenderer.invoke('acct:setActive', id) as Promise<AcctResult<void>>,
    remove: (id: number) => ipcRenderer.invoke('acct:remove', id) as Promise<AcctResult<void>>
  },
  tools: {
    onCall: (cb: (c: { callId: string; name: string; input: unknown }) => void) => {
      const h = (_: unknown, c: { callId: string; name: string; input: unknown }) => cb(c)
      ipcRenderer.on('tool:call', h)
      return () => { ipcRenderer.removeListener('tool:call', h) }
    },
    respond: (callId: string, reply: { ok: boolean; text: string; image?: string }) => ipcRenderer.invoke('tool:result', callId, reply) as Promise<void>
  },
  fmp: {
    keyStatus: () => ipcRenderer.invoke('fmp:key:status') as Promise<KeyStatus>,
    setKey: (k: string) => ipcRenderer.invoke('fmp:key:set', k) as Promise<void>,
    clearKey: () => ipcRenderer.invoke('fmp:key:clear') as Promise<void>,
    bars: (p: { symbol: string; interval: FmpInterval; from: string; to?: string }) => call<Bar[]>('fmp:bars', p),
    quotes: (symbols: string[]) => call<Rec[]>('fmp:quotes', symbols),
    search: (q: string) => call<FmpSearchHit[]>('fmp:search', q),
    overview: (symbol: string, force?: boolean) => call<FmpOverview>('fmp:overview', symbol, force),
    analyst: (symbol: string, force?: boolean) => call<FmpAnalyst>('fmp:analyst', symbol, force),
    screener: (p: { query: ScreenerQuery; force?: boolean }) => call<FmpScreener>('fmp:screener', p),
    screenerOptions: () => call<FmpScreenerOptions>('fmp:screenerOptions'),
    congress: (p: { kind: 'latest' | 'symbol' | 'name'; chamber: 'senate' | 'house' | 'both'; symbol?: string; name?: string; page?: number; limit?: number; force?: boolean }) => call<FmpCongress>('fmp:congress', p),
    market: (p: { date?: string; exchange?: string; force?: boolean }) => call<FmpMarket>('fmp:market', p),
    cacheStats: () => ipcRenderer.invoke('fmp:cache:stats') as Promise<{ entries: number; bytes: number; oldest: number | null }>,
    clearCache: () => ipcRenderer.invoke('fmp:cache:clear') as Promise<void>,
    fundamentals: (symbol: string) => call<FmpFundamentals>('fmp:fundamentals', symbol),
    news: (p: { symbol?: string; symbols?: string[]; general?: boolean; limit?: number; page?: number }) => call<NewsArticle[]>('fmp:news', p),
    test: () => call<FmpTestRow[]>('fmp:test'),
    caps: () => ipcRenderer.invoke('fmp:caps:get') as Promise<FmpCaps | null>,
    onCapsChanged: (cb: (c: FmpCaps | null) => void) => {
      const h = (_: unknown, c: FmpCaps | null) => cb(c)
      ipcRenderer.on('fmp:caps:changed', h)
      return () => { ipcRenderer.removeListener('fmp:caps:changed', h) }
    },
    mcpStatus: () => ipcRenderer.invoke('fmp:mcp:status') as Promise<{ ok: boolean; count?: number; transport?: string; sample?: string[]; error?: string }>
  },
  chat: {
    send: (req: SendRequest) => ipcRenderer.invoke('chat:send', req) as Promise<{ ok: boolean }>,
    stop: (requestId: string) => ipcRenderer.invoke('chat:stop', requestId) as Promise<void>,
    list: () => ipcRenderer.invoke('chat:list') as Promise<ChatSummary[]>,
    get: (id: string) => ipcRenderer.invoke('chat:get', id) as Promise<StoredMessage[]>,
    remove: (id: string) => ipcRenderer.invoke('chat:delete', id) as Promise<void>,
    keyStatus: () => ipcRenderer.invoke('chat:key:status') as Promise<KeyStatus>,
    setKey: (key: string) => ipcRenderer.invoke('chat:key:set', key) as Promise<void>,
    clearKey: () => ipcRenderer.invoke('chat:key:clear') as Promise<void>,
    onEvent: (cb: (e: ChatEvent) => void) => {
      const h = (_: unknown, e: ChatEvent) => cb(e)
      ipcRenderer.on('chat:event', h)
      return () => { ipcRenderer.removeListener('chat:event', h) }
    }
  },
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key) as Promise<any>,
  setSetting: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value) as Promise<void>,
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url) as Promise<void>,
  backup: {
    create: () => ipcRenderer.invoke('backup:create') as Promise<{ ok: true; path: string; size: number; contents: string } | { ok: false; canceled?: boolean; error?: string }>,
    restore: () => ipcRenderer.invoke('backup:restore') as Promise<{ ok: true } | { ok: false; canceled?: boolean; error?: string }>
  },
  checkUpdates: () => ipcRenderer.invoke('update:check') as Promise<{ ok: true; current: string; latest: string; available: boolean; url: string; downloadUrl?: string; notes: string; published: string } | { ok: false; error: string }>,
  onUpdateAvailable: (cb: (u: { latest: string; url: string; downloadUrl?: string }) => void) => {
    const h = (_e: unknown, u: { latest: string; url: string; downloadUrl?: string }) => cb(u)
    ipcRenderer.on('update:available', h)
    return () => { ipcRenderer.removeListener('update:available', h) }
  },
  openLicenses: () => ipcRenderer.invoke('app:licenses') as Promise<{ ok: true } | { ok: false; error: string }>,
  about: () => ipcRenderer.invoke('app:about') as Promise<{ name: string; description: string; version: string; packaged: boolean; license: string; electron: string; chromium: string; node: string; platform: string; arch: string; dataFolder: string; repository: string }>,
  quit: () => ipcRenderer.invoke('app:quit'),
  win: {
    minimize: () => ipcRenderer.invoke('win:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('win:toggleMaximize'),
    close: () => ipcRenderer.invoke('win:close'),
    isMaximized: () => ipcRenderer.invoke('win:isMaximized') as Promise<boolean>,
    onMaximized: (cb: (m: boolean) => void) => {
      const h = (_: unknown, m: boolean) => cb(m)
      ipcRenderer.on('win:maximized', h)
      return () => { ipcRenderer.removeListener('win:maximized', h) }
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
export type Api = typeof api
