export interface WatchList { id: number; name: string; symbols: string[] }
export type WlResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }
export const SYMBOL_RE = /^[A-Z0-9.^=-]{1,15}$/
