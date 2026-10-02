import { safeStorage } from 'electron'
import type { DatabaseSync } from 'node:sqlite'

export interface SecretStatus { source: 'stored' | 'env' | 'none'; encrypted: boolean }

/** API keys live in the settings table, encrypted with the OS keyring when it is available. */
export function makeSecrets(db: DatabaseSync) {
  const row = (name: string) => db.prepare('SELECT value FROM settings WHERE key = ?').get(name) as { value: string } | undefined
  return {
    get(name: string): string | null {
      const r = row(name)
      if (!r) return null
      const { data, encrypted } = JSON.parse(r.value) as { data: string; encrypted: boolean }
      return encrypted ? safeStorage.decryptString(Buffer.from(data, 'base64')) : data
    },
    set(name: string, value: string): void {
      const encrypted = safeStorage.isEncryptionAvailable()
      const data = encrypted ? safeStorage.encryptString(value).toString('base64') : value
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(name, JSON.stringify({ data, encrypted }))
    },
    clear(name: string): void { db.prepare('DELETE FROM settings WHERE key = ?').run(name) },
    status(name: string, envVar: string): SecretStatus {
      const r = row(name)
      if (r) return { source: 'stored', encrypted: (JSON.parse(r.value) as { encrypted: boolean }).encrypted }
      return { source: process.env[envVar] ? 'env' : 'none', encrypted: false }
    }
  }
}
export type Secrets = ReturnType<typeof makeSecrets>
