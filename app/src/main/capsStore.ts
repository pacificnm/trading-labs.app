import type { DatabaseSync } from 'node:sqlite'
import type { FmpCaps } from '../shared/fmpCaps'

/** The last plan check, kept in the settings table so every part of the main process (data, orders, chat) reads the same answer. */
export function readCaps(db: DatabaseSync | null): FmpCaps | null {
  if (!db) return null
  const r = db.prepare("SELECT value FROM settings WHERE key = 'fmpCaps'").get() as { value: string } | undefined
  try { return r ? (JSON.parse(r.value) as FmpCaps) : null } catch { return null }
}

export function saveCaps(db: DatabaseSync | null, caps: FmpCaps | null): void {
  if (!db) return
  if (caps) db.prepare("INSERT INTO settings (key, value) VALUES ('fmpCaps', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(caps))
  else db.prepare("DELETE FROM settings WHERE key = 'fmpCaps'").run()
}
