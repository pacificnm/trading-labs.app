import { compareVersions } from '../shared/version'

export interface UpdateInfo {
  ok: true
  current: string
  latest: string
  available: boolean
  /** the release page, always safe to open */
  url: string
  /** direct download for this machine's package type, when the release has one */
  downloadUrl?: string
  notes: string
  published: string
}
export type UpdateResult = UpdateInfo | { ok: false; error: string }

interface Release { tag_name?: string; html_url?: string; body?: string; published_at?: string; draft?: boolean; prerelease?: boolean; assets?: { name: string; browser_download_url: string }[] }

/** "owner/repo" from a package.json repository URL, or null when it is not on GitHub. */
export function githubSlug(repoUrl: string): string | null {
  const m = /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(repoUrl)
  return m ? `${m[1]}/${m[2]}` : null
}

// Picks the file a person on this machine would install: matching OS and CPU, and on Linux the .deb when they installed the .deb, else the AppImage.
export function pickAsset(assets: { name: string; browser_download_url: string }[], platform: string, arch: string, appImage: boolean): string | undefined {
  const cpu = arch === 'arm64' ? /(arm64|aarch64)/i : /(x86_64|x64|amd64)/i
  const ext = platform === 'win32' ? /\.exe$/i : platform === 'darwin' ? /\.dmg$/i : appImage ? /\.AppImage$/i : /\.deb$/i
  return assets.find((a) => ext.test(a.name) && cpu.test(a.name))?.browser_download_url
}

// Reads the newest published release from GitHub. Nothing is downloaded or installed here: the person opens the page and installs it themselves.
export function createUpdates(deps: { fetch: typeof fetch; current: string; slug: string | null; platform: string; arch: string; appImage: boolean }) {
  return async function check(): Promise<UpdateResult> {
    if (!deps.slug) return { ok: false, error: 'No GitHub repository is set in package.json.' }
    try {
      const res = await deps.fetch(`https://api.github.com/repos/${deps.slug}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'trading-lab' },
        signal: AbortSignal.timeout(15000)
      })
      // "latest" answers 404 until the first non-draft, non-prerelease release exists
      if (res.status === 404) return { ok: true, current: deps.current, latest: deps.current, available: false, url: `https://github.com/${deps.slug}/releases`, notes: '', published: '' }
      if (!res.ok) return { ok: false, error: res.status === 403 ? 'GitHub is limiting requests from this network. Try again later.' : `GitHub answered ${res.status}.` }
      const r = (await res.json()) as Release
      const latest = (r.tag_name ?? '').replace(/^v/, '')
      const cmp = compareVersions(latest, deps.current)
      if (cmp === null) return { ok: false, error: `The latest release tag "${r.tag_name ?? ''}" is not a version number.` }
      return {
        ok: true, current: deps.current, latest, available: cmp > 0,
        url: r.html_url ?? `https://github.com/${deps.slug}/releases`,
        downloadUrl: pickAsset(r.assets ?? [], deps.platform, deps.arch, deps.appImage),
        notes: r.body ?? '', published: r.published_at ?? ''
      }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? `Could not reach GitHub: ${e.message}` : 'Could not reach GitHub.' }
    }
  }
}
