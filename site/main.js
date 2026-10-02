// The download section reads the latest GitHub release when the page loads, so this site never needs editing for a new version.
// Only text is written into the page with textContent, and links are used only if they point at github.com.
(function () {
  var REPO = 'pacificnm/trading-labs.app'
  var API = 'https://api.github.com/repos/' + REPO + '/releases/latest'
  var RELEASES = 'https://github.com/' + REPO + '/releases/latest'

  var status = document.getElementById('dl-status')
  var grid = document.getElementById('dl-grid')
  var fallback = document.getElementById('dl-fallback')
  var heroNote = document.getElementById('hero-version')

  function osGuess() {
    var p = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '').toLowerCase()
    if (p.indexOf('win') >= 0) return 'windows'
    if (p.indexOf('mac') >= 0 || p.indexOf('iphone') >= 0 || p.indexOf('ipad') >= 0) return 'macos'
    if (p.indexOf('linux') >= 0 || p.indexOf('x11') >= 0 || p.indexOf('cros') >= 0) return 'linux'
    return ''
  }
  // ARM shows up in the user agent on Linux and Windows on ARM; Macs hide it, so Apple Silicon (the common case) is simply listed first
  var onArm = /aarch64|arm64|armv8/i.test(navigator.userAgent || '')
  function rank(f) { return (/ARM64|Apple Silicon/.test(f.label) ? 1 : 0) === (onArm ? 1 : 0) ? 0 : 1 }
  function mb(n) { return (n / 1048576).toFixed(0) + ' MB' }
  function safe(url) { return typeof url === 'string' && /^https:\/\/github\.com\//.test(url) }

  // which of the release files is which, from its name
  function classify(a) {
    var n = a.name
    if (/\.exe$/i.test(n)) return { os: 'windows', label: 'Windows installer (64-bit)' }
    if (/\.dmg$/i.test(n)) return /arm64/i.test(n) ? { os: 'macos', label: 'Apple Silicon (M1 or newer)' } : { os: 'macos', label: 'Intel Mac' }
    if (/\.AppImage$/i.test(n)) return /(arm64|aarch64)/i.test(n) ? { os: 'linux', label: 'AppImage, ARM64' } : { os: 'linux', label: 'AppImage, 64-bit' }
    if (/\.deb$/i.test(n)) return /(arm64|aarch64)/i.test(n) ? { os: 'linux', label: 'Debian package, ARM64' } : { os: 'linux', label: 'Debian package, 64-bit' }
    return null
  }

  function card(os, title, files, mine) {
    var d = document.createElement('div')
    d.className = 'dl' + (mine ? ' mine' : '')
    var h = document.createElement('h3')
    h.textContent = title
    if (mine) { var t = document.createElement('span'); t.className = 'tag'; t.textContent = 'Your system'; h.appendChild(t) }
    d.appendChild(h)
    files = files.slice().sort(function (a, b) { return rank(a) - rank(b) })
    files.forEach(function (f) {
      var a = document.createElement('a')
      a.className = 'btn' + (mine && f === files[0] ? ' primary' : '')
      a.href = f.url
      a.rel = 'noopener'
      var l = document.createElement('span'); l.textContent = f.label
      var s = document.createElement('small'); s.textContent = mb(f.size)
      a.appendChild(l); a.appendChild(s)
      d.appendChild(a)
    })
    return d
  }

  function fail() {
    status.textContent = 'The newest version is on GitHub.'
    fallback.hidden = false
    var hd = document.getElementById('hero-download'); if (hd) hd.href = RELEASES
  }

  fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json() })
    .then(function (rel) {
      var groups = { windows: [], macos: [], linux: [] }
      ;(rel.assets || []).forEach(function (a) {
        var c = classify(a)
        if (c && safe(a.browser_download_url)) groups[c.os].push({ url: a.browser_download_url, label: c.label, size: a.size })
      })
      var total = groups.windows.length + groups.macos.length + groups.linux.length
      if (!total) return fail()
      var me = osGuess()
      var version = String(rel.tag_name || '').replace(/^v/, '')
      var when = rel.published_at ? new Date(rel.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''
      status.textContent = ''
      status.appendChild(document.createTextNode('Latest version ' + version + (when ? ' (' + when + ')' : '') + '. '))
      if (safe(rel.html_url)) { var n = document.createElement('a'); n.href = rel.html_url; n.rel = 'noopener'; n.textContent = 'Release notes'; status.appendChild(n) }
      var defs = [['windows', 'Windows'], ['macos', 'macOS'], ['linux', 'Linux']]
      // show the visitor's own system first
      defs.sort(function (a, b) { return (b[0] === me) - (a[0] === me) })
      grid.textContent = ''
      defs.forEach(function (d) { if (groups[d[0]].length) grid.appendChild(card(d[0], d[1], groups[d[0]], d[0] === me)) })
      grid.hidden = false
      if (heroNote) heroNote.textContent = 'Version ' + version + ' for Windows, macOS and Linux.'
    })
    .catch(fail)
})()
