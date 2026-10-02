// Writes build/third-party-notices.txt: the name, version, license and license text of every third-party package that ends up inside the app.
// MIT, BSD, ISC and Apache all require their notices to travel with the software, and the installers are the place they travel.
// It also refuses to finish when the UI imports a package this list does not cover, so the notices cannot quietly fall behind.
// Electron and Chromium ship their own LICENSE.electron.txt and LICENSES.chromium.html inside the app, so they are only mentioned here.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

// main and preload are externalised (their `dependencies` are shipped as node_modules); the renderer is bundled by Vite, so the
// libraries it imports are bundled into the app even though they are devDependencies. Keep this list in step with the renderer's imports (checked below).
const RENDERER_BUNDLED = ['react', 'react-dom', 'lightweight-charts', 'lucide-react', 'react-markdown', 'remark-gfm', 'react-resizable-panels']
const ROOTS = [...new Set([...Object.keys(pkg.dependencies ?? {}), ...RENDERER_BUNDLED])]

// text some licenses ask to be shown, which the npm package itself does not contain
const NOTICES = {
  'lightweight-charts': `TradingView Lightweight Charts™
Copyright (с) 2025 TradingView, Inc. https://www.tradingview.com/`,
}

// license text for packages whose npm tarball leaves it out, copied from their upstream repository; used only when the package ships none
const SUPPLEMENTAL = {
  'fancy-canvas': `https://github.com/tradingview/fancy-canvas (LICENSE)\n\nCopyright (c) 2019 TradingView, Inc

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`,
  standardwebhooks: 'Declared as MIT in its package metadata. The top-level LICENSE file of its repository (https://github.com/standard-webhooks/standard-webhooks) is the Apache License 2.0, so both are named here; see that repository for the terms that apply to this library.'
}

function findDir(name, from) {
  for (let dir = from; ; dir = dirname(dir)) {
    const p = join(dir, 'node_modules', name)
    if (existsSync(join(p, 'package.json'))) return p
    if (dir === dirname(dir)) return null
  }
}
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))
const licenseOf = (j) => (typeof j.license === 'string' ? j.license : j.license?.type ?? (Array.isArray(j.licenses) ? j.licenses.map((l) => l.type).join(' OR ') : 'UNKNOWN'))
const textFiles = (dir, re) => readdirSync(dir).filter((f) => re.test(f)).sort().map((f) => ({ f, text: readFileSync(join(dir, f), 'utf8').trim() })).filter((x) => x.text)

const found = new Map() // "name@version" -> record
const problems = []
function visit(name, from) {
  const dir = findDir(name, from)
  if (!dir) { problems.push(`${name}: not installed (run npm ci)`); return }
  const j = readJson(join(dir, 'package.json'))
  const key = `${j.name}@${j.version}`
  if (found.has(key)) return
  const lic = textFiles(dir, /^(licen[cs]e|copying)(\.|$)/i)
  const notice = textFiles(dir, /^notice(\.|$)/i)
  found.set(key, { name: j.name, version: j.version, license: licenseOf(j), homepage: j.homepage ?? j.repository?.url ?? '', lic, notice, supplemental: lic.length ? undefined : SUPPLEMENTAL[j.name] })
  for (const dep of Object.keys(j.dependencies ?? {})) visit(dep, dir)
}
for (const r of ROOTS) visit(r, root)

// every bare import in the UI must belong to a package listed above
function walk(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : /\.(tsx?|jsx?)$/.test(e.name) ? [join(dir, e.name)] : [])) }
const used = new Set()
for (const f of walk(join(root, 'src', 'renderer', 'src'))) for (const m of readFileSync(f, 'utf8').matchAll(/(?:from|import)\s*\(?\s*['"]([^'"./][^'"]*)['"]/g)) used.add(m[1].startsWith('@') ? m[1].split('/').slice(0, 2).join('/') : m[1].split('/')[0])
for (const u of used) if (!ROOTS.includes(u)) problems.push(`the UI imports "${u}", which is not covered. Add it to RENDERER_BUNDLED in scripts/licenses.mjs.`)
if (problems.length) { console.error('licenses: ' + problems.join('\n')); process.exit(1) }

const list = [...found.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
const rule = '='.repeat(78)
let out = `Trading Lab third-party notices\n${rule}\n\nTrading Lab itself is released under the MIT License (see LICENSE).\nIt includes the third-party software below, each under its own license.\nElectron and Chromium carry their own notices in LICENSE.electron.txt and LICENSES.chromium.html in this folder.\n\n`
for (const [name, text] of Object.entries(NOTICES)) if (found.has([...found.keys()].find((k) => k.startsWith(name + '@')) ?? '')) out += `${text}\n\n`
out += `${list.length} packages\n\n`
for (const p of list) {
  out += `${rule}\n${p.name} ${p.version}\nLicense: ${p.license}${p.homepage ? `\n${p.homepage}` : ''}\n\n`
  if (p.lic.length) for (const l of p.lic) out += `${l.text}\n\n`
  else if (p.supplemental) out += `${p.supplemental}\n\n`
  else out += `(This package does not include its license text. See the address above, or the license named here.)\n\n`
  for (const n of p.notice) out += `NOTICE:\n${n.text}\n\n`
}
mkdirSync(join(root, 'build'), { recursive: true })
const dest = join(root, 'build', 'third-party-notices.txt')
writeFileSync(dest, out)
const noText = list.filter((p) => !p.lic.length && !p.supplemental)
console.log(`wrote ${dest} (${list.length} packages, ${Math.round(out.length / 1024)} KB)${noText.length ? `; no license text shipped by: ${noText.map((p) => p.name).join(', ')}` : ''}`)
