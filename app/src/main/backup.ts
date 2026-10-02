import { DatabaseSync } from 'node:sqlite'
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'fs'
import { join } from 'path'
import { compareVersions } from '../shared/version'

// Settings rows that hold API keys. A backup never contains them (they are encrypted for this computer's keyring and
// are secrets), and a restore keeps the ones already on this computer. Keep in step with KEY_NAME in fmp.ts and KEY_SETTING in chat.ts.
export const SECRET_KEYS = ['fmp_key', 'anthropic_key']
// what a file must contain to be accepted as a Trading Lab database
const REQUIRED = ['settings', 'accounts', 'orders', 'journal_entries']

export interface BackupSummary { accounts: number; orders: number; journal: number; watchlists: number; portfolios: number; chats: number; createdAt: string; appVersion: string }

const count = (db: DatabaseSync, table: string): number => {
  try { return Number((db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n) } catch { return 0 }
}

/** Writes a consistent single-file copy of the live database to dest, without keys or the market-data cache. */
export function createBackup(live: DatabaseSync, dest: string, appVersion: string): BackupSummary {
  // build beside the target and rename, so a failure never replaces an existing good backup with half a file
  const part = dest + '.part'
  rmSync(part, { force: true })
  live.prepare('VACUUM INTO ?').run(part)
  const c = new DatabaseSync(part)
  let summary: BackupSummary
  try {
    c.exec(`DELETE FROM settings WHERE key IN (${SECRET_KEYS.map((k) => `'${k}'`).join(',')})`)
    try { c.exec('DELETE FROM fmp_cache') } catch { /* table only exists once the feed was used */ }
    c.exec('CREATE TABLE IF NOT EXISTS backup_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
    const put = c.prepare('INSERT INTO backup_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    const createdAt = new Date().toISOString()
    put.run('app_version', appVersion)
    put.run('created_at', createdAt)
    c.exec('VACUUM')
    c.exec('PRAGMA journal_mode = DELETE')
    summary = { accounts: count(c, 'accounts'), orders: count(c, 'orders'), journal: count(c, 'journal_entries'), watchlists: count(c, 'watchlists'), portfolios: count(c, 'portfolios'), chats: count(c, 'chats'), createdAt, appVersion }
  } catch (e) {
    c.close()
    rmSync(part, { force: true })
    throw e
  }
  c.close()
  rmSync(dest, { force: true })
  renameSync(part, dest)
  return summary
}

export type Inspection = { ok: true; summary: BackupSummary } | { ok: false; error: string }

/** Opens a candidate file read-only and decides whether it is a usable Trading Lab backup. */
export function inspectBackup(path: string, appVersion: string): Inspection {
  let c: DatabaseSync | null = null
  try {
    c = new DatabaseSync(path, { readOnly: true })
    const check = (c.prepare('PRAGMA integrity_check').get() as { integrity_check: string }).integrity_check
    if (check !== 'ok') return { ok: false, error: 'The file is damaged (it failed SQLite\'s integrity check).' }
    const tables = new Set((c.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map((t) => t.name))
    if (REQUIRED.some((t) => !tables.has(t))) return { ok: false, error: 'This is a database, but not a Trading Lab one.' }
    const meta = tables.has('backup_meta') ? Object.fromEntries((c.prepare('SELECT key, value FROM backup_meta').all() as { key: string; value: string }[]).map((r) => [r.key, r.value])) : {}
    const made = meta['app_version'] ?? ''
    if (made && (compareVersions(made, appVersion) ?? 0) > 0) return { ok: false, error: `This backup was made by a newer version (${made}). Update Trading Lab first (you have ${appVersion}).` }
    return { ok: true, summary: { accounts: count(c, 'accounts'), orders: count(c, 'orders'), journal: count(c, 'journal_entries'), watchlists: count(c, 'watchlists'), portfolios: count(c, 'portfolios'), chats: count(c, 'chats'), createdAt: meta['created_at'] ?? '', appVersion: made } }
  } catch (e) {
    const m = e instanceof Error ? e.message : ''
    return { ok: false, error: /not a database/i.test(m) ? 'That file is not a database.' : `Could not read the file: ${m}` }
  } finally {
    c?.close()
  }
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

/**
 * Replaces the live database with a backup. The caller must restart the app afterwards: the live handle is closed here.
 * Order matters: everything that can fail happens before the live file is touched, and the current data is saved first.
 */
export function restoreBackup(o: { live: DatabaseSync; livePath: string; backupPath: string; safetyDir: string; appVersion: string }): { safetyCopy: string } {
  mkdirSync(o.safetyDir, { recursive: true })
  const safetyCopy = join(o.safetyDir, `before-restore-${stamp()}.db`)
  createBackup(o.live, safetyCopy, o.appVersion)
  // keep only the 5 newest safety copies
  const old = readdirSync(o.safetyDir).filter((f) => f.startsWith('before-restore-') && f.endsWith('.db')).sort().reverse().slice(5)
  for (const f of old) rmSync(join(o.safetyDir, f), { force: true })

  const stage = o.livePath + '.restoring'
  rmSync(stage, { force: true })
  try {
    copyFileSync(o.backupPath, stage)
    const s = new DatabaseSync(stage)
    try {
      // this computer's own keys survive a restore, whatever the backup came from
      const keep = o.live.prepare(`SELECT key, value FROM settings WHERE key IN (${SECRET_KEYS.map(() => '?').join(',')})`).all(...SECRET_KEYS) as { key: string; value: string }[]
      const put = s.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      for (const r of keep) put.run(r.key, r.value)
      s.exec('PRAGMA journal_mode = DELETE')
    } finally { s.close() }
  } catch (e) {
    rmSync(stage, { force: true })
    throw e
  }
  o.live.close()
  rmSync(o.livePath + '-wal', { force: true })
  rmSync(o.livePath + '-shm', { force: true })
  renameSync(stage, o.livePath)
  return { safetyCopy }
}

export const fileSize = (p: string): number => (existsSync(p) ? statSync(p).size : 0)
