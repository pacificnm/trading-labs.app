// Release tags look like "v1.2.3" (optionally "-beta.1"). Only the numeric core decides what is newer.
export function parseVersion(v: string): number[] | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(v.trim())
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

/** >0 when a is newer than b, <0 when older, 0 when equal; null when either is not a version. */
export function compareVersions(a: string, b: string): number | null {
  const x = parseVersion(a)
  const y = parseVersion(b)
  if (!x || !y) return null
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]
  return 0
}
