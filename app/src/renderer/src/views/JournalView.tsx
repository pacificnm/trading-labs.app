import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Plus, Search, Sparkles, Trash2, Ticket, MessageSquare, Ban, RotateCcw } from 'lucide-react'
import { EMOTIONS, type FollowedPlan, type JournalItem } from '../../../shared/journal'
import { money } from '../../../shared/trade'
import { formatDateTime } from '../display'
import { toast } from '../toast'

type Chip = 'all' | 'ideas' | 'open' | 'closed' | 'skipped' | 'notes' | 'claude'
const CHIPS: [Chip, string][] = [['all', 'All'], ['ideas', 'Ideas'], ['open', 'Open'], ['closed', 'Closed'], ['skipped', 'Skipped'], ['notes', 'Notes'], ['claude', 'By Claude']]

const matches = (e: JournalItem, chip: Chip): boolean => {
  switch (chip) {
    case 'ideas': return e.kind === 'trade' && e.status === 'idea'
    case 'open': return e.trade.state === 'working' || e.trade.state === 'open'
    case 'closed': return e.trade.state === 'closed'
    case 'skipped': return e.status === 'skipped'
    case 'notes': return e.kind === 'note'
    case 'claude': return e.source === 'claude'
    default: return true
  }
}
const badge = (e: JournalItem): [string, string] =>
  e.kind === 'note' ? ['Note', 'note']
  : e.status === 'skipped' ? ['Skipped', 'skipped']
  : e.trade.state === 'open' ? ['Open', 'open'] : e.trade.state === 'working' ? ['Order working', 'open']
  : e.trade.state === 'closed' ? ['Closed', 'closed'] : e.trade.state === 'cancelled' ? ['Cancelled', 'skipped'] : ['Idea', 'idea']
const plText = (n: number | null) => (n == null ? '' : `${n >= 0 ? '+' : '-'}${money(Math.abs(n))}`)
const rText = (r: number | null) => (r == null ? '' : `${r >= 0 ? '+' : ''}${r.toFixed(2)}R`)

interface Form {
  title: string; symbol: string; direction: string; kind: 'trade' | 'note'; body: string; setup: string; tags: string
  entry: string; stop: string; target: string; qty: string; emotions: string[]; followed: FollowedPlan | ''; review: string; lesson: string
}
const toForm = (e: JournalItem): Form => ({
  title: e.title, symbol: e.symbol ?? '', direction: e.direction ?? '', kind: e.kind, body: e.body, setup: e.setup, tags: e.tags.join(', '),
  entry: e.plan_entry != null ? String(e.plan_entry) : '', stop: e.plan_stop != null ? String(e.plan_stop) : '', target: e.plan_target != null ? String(e.plan_target) : '',
  qty: e.plan_qty != null ? String(e.plan_qty) : '', emotions: e.emotions, followed: e.followed_plan ?? '', review: e.review, lesson: e.lesson
})
const n = (s: string) => { const v = parseFloat(s); return Number.isFinite(v) ? v : null }

function Detail({ item, onOpenChart, onOpenTicket, onAskClaude, onDeleted }: {
  item: JournalItem; onOpenChart: (s: string) => void; onOpenTicket: (e: JournalItem) => void; onAskClaude: (t: string) => void; onDeleted: () => void
}) {
  const [f, setF] = useState<Form>(() => toForm(item))
  const [saved, setSaved] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(false)
  const [comment, setComment] = useState('')
  const dirty = useRef(false)

  useEffect(() => { dirty.current = false; setF(toForm(item)); setSaved(false) }, [item.id])
  useEffect(() => { if (!dirty.current) setF(toForm(item)) }, [item.updated_at]) // edits made elsewhere (e.g. by Claude)
  useEffect(() => { setImage(null); if (item.has_image) window.api.journal.image(item.id).then((d) => setImage(d)) }, [item.id, item.has_image])

  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(async () => {
      await window.api.journal.update(item.id, {
        title: f.title, symbol: f.symbol || null, direction: (f.direction || null) as 'long' | 'short' | null, kind: f.kind, body: f.body, setup: f.setup,
        tags: f.tags.split(',').map((s) => s.trim()).filter(Boolean), plan_entry: n(f.entry), plan_stop: n(f.stop), plan_target: n(f.target), plan_qty: n(f.qty),
        emotions: f.emotions, followed_plan: f.followed || null, review: f.review, lesson: f.lesson
      })
      dirty.current = false
      setSaved(true)
    }, 700)
    return () => clearTimeout(t)
  }, [f])

  const set = (p: Partial<Form>) => { dirty.current = true; setSaved(false); setF((x) => ({ ...x, ...p })) }
  const [label, cls] = badge(item)
  const t = item.trade
  const risk = n(f.entry) != null && n(f.stop) != null && n(f.qty) ? Math.abs(n(f.entry)! - n(f.stop)!) * n(f.qty)! : null
  const reward = n(f.entry) != null && n(f.target) != null && n(f.qty) ? Math.abs(n(f.target)! - n(f.entry)!) * n(f.qty)! : null
  const isTrade = f.kind === 'trade'

  const setStatus = async (status: 'idea' | 'skipped') => { await window.api.journal.update(item.id, { status }) }
  const del = async () => {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return
    await window.api.journal.remove(item.id); toast.info('Journal entry deleted'); onDeleted()
  }
  const addComment = async () => { if (comment.trim()) { await window.api.journal.comment(item.id, { by: 'user', text: comment.trim() }); setComment('') } }
  const review = () => onAskClaude(`Please review my journal entry #${item.id} ("${item.title}"). Read it with journal_get_entry, then give me honest feedback on my reasoning, risk management and what I can learn from it. Save your feedback as a comment on the entry with journal_add_comment.`)

  return (
    <div className="jr-detail">
      <div className="jr-head">
        <input className="jr-title" value={f.title} placeholder="Title" onChange={(e) => set({ title: e.target.value })} />
        <div className="jr-actions">
          <span className={'jr-badge ' + cls}>{label}</span>
          {item.source === 'claude' && <span className="jr-badge claude"><Sparkles size={11} /> Claude</span>}
          <span className="spacer" />
          <span className="muted jr-saved">{saved ? 'Saved ✓' : dirty.current ? 'Saving…' : ''}</span>
          {isTrade && f.symbol && item.status !== 'taken' && t.state === 'none' && <button className="btn small" onClick={() => onOpenTicket(item)} title="Open an order ticket pre-filled from this plan"><Ticket size={13} /> Open in ticket</button>}
          <button className="btn small" onClick={review}><MessageSquare size={13} /> Ask Claude to review</button>
          {isTrade && t.state === 'none' && (item.status === 'skipped'
            ? <button className="btn small" onClick={() => setStatus('idea')}><RotateCcw size={13} /> Reopen</button>
            : <button className="btn small" onClick={() => setStatus('skipped')}><Ban size={13} /> Skip</button>)}
          <button className="icon-btn" title="Delete entry" onClick={del}><Trash2 size={15} /></button>
        </div>
        <div className="muted jr-meta">{formatDateTime(item.created_at)}{item.source === 'claude' ? ' · suggested by Claude' : ''}</div>
      </div>

      <div className="jr-grid2">
        <label>Type<select value={f.kind} onChange={(e) => set({ kind: e.target.value as 'trade' | 'note' })}><option value="trade">Trade</option><option value="note">Note / lesson</option></select></label>
        {isTrade && <>
          <label>Symbol<input value={f.symbol} onChange={(e) => set({ symbol: e.target.value.toUpperCase() })} placeholder="AAPL" />{f.symbol && <a className="link jr-open" onClick={() => onOpenChart(f.symbol)}>Open chart</a>}</label>
          <label>Direction<select value={f.direction} onChange={(e) => set({ direction: e.target.value })}><option value="">—</option><option value="long">Long</option><option value="short">Short</option></select></label>
        </>}
        <label>Setup<input value={f.setup} onChange={(e) => set({ setup: e.target.value })} placeholder="e.g. support bounce, breakout" /></label>
        <label className="wide">Tags<input value={f.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="comma separated" /></label>
      </div>

      {t.state !== 'none' && (
        <section className="jr-sec">
          <h4>Result</h4>
          <div className="jr-result">
            <div><span>Status</span><b>{label}</b></div>
            <div><span>Shares</span><b>{t.qty ?? '—'}</b></div>
            <div><span>Avg entry</span><b>{t.entryPrice != null ? t.entryPrice.toFixed(2) : '—'}</b></div>
            <div><span>Avg exit</span><b>{t.exitPrice != null ? t.exitPrice.toFixed(2) : '—'}</b></div>
            <div><span>Realized P/L</span><b className={t.realizedPl == null ? '' : t.realizedPl >= 0 ? 'up' : 'down'}>{t.realizedPl != null ? plText(t.realizedPl) : '—'}</b></div>
            <div><span>R multiple</span><b className={t.rMultiple == null ? '' : t.rMultiple >= 0 ? 'up' : 'down'}>{t.rMultiple != null ? rText(t.rMultiple) : '—'}</b></div>
          </div>
          {t.state === 'open' && <div className="muted">Still open. The result is realized P/L so far; it updates as fills come in.</div>}
        </section>
      )}

      {isTrade && (
        <section className="jr-sec">
          <h4>Plan</h4>
          <div className="jr-grid2">
            <label>Entry<input type="number" step="0.01" value={f.entry} onChange={(e) => set({ entry: e.target.value })} /></label>
            <label>Stop<input type="number" step="0.01" value={f.stop} onChange={(e) => set({ stop: e.target.value })} /></label>
            <label>Target<input type="number" step="0.01" value={f.target} onChange={(e) => set({ target: e.target.value })} /></label>
            <label>Shares<input type="number" step="1" value={f.qty} onChange={(e) => set({ qty: e.target.value })} /></label>
          </div>
          {(risk != null || reward != null) && (
            <div className="muted">{risk != null && <>Planned risk <b className="down">{money(risk)}</b></>}{reward != null && <> · reward <b className="up">{money(reward)}</b></>}{risk && reward ? <> · reward:risk <b>{(reward / risk).toFixed(2)} : 1</b></> : null}</div>
          )}
        </section>
      )}

      <section className="jr-sec">
        <h4>{isTrade ? 'Why this trade? (thesis, and what would prove it wrong)' : 'Notes'}</h4>
        <textarea rows={6} value={f.body} onChange={(e) => set({ body: e.target.value })} placeholder={isTrade ? 'What did you see? Why now? Where is the idea wrong?' : 'Write anything worth remembering…'} />
      </section>

      {item.has_image && (
        <section className="jr-sec">
          <h4>Chart when this was recorded</h4>
          {image ? <img className={'jr-img' + (zoom ? ' zoom' : '')} src={`data:image/png;base64,${image}`} onClick={() => setZoom(!zoom)} title="Click to enlarge" /> : <div className="muted">Loading…</div>}
        </section>
      )}

      <section className="jr-sec">
        <h4>Review — what happened and what I learned</h4>
        <div className="jr-chips"><span className="muted">How I felt:</span>
          {EMOTIONS.map((em) => <button key={em} className={'tk-chip' + (f.emotions.includes(em) ? ' on' : '')} onClick={() => set({ emotions: f.emotions.includes(em) ? f.emotions.filter((x) => x !== em) : [...f.emotions, em] })}>{em}</button>)}
        </div>
        {isTrade && (
          <div className="jr-chips"><span className="muted">Did I follow my plan?</span>
            {(['yes', 'partly', 'no'] as const).map((v) => <button key={v} className={'tk-chip' + (f.followed === v ? ' on' : '')} onClick={() => set({ followed: f.followed === v ? '' : v })}>{v === 'yes' ? 'Yes' : v === 'partly' ? 'Partly' : 'No'}</button>)}</div>
        )}
        <textarea rows={4} value={f.review} onChange={(e) => set({ review: e.target.value })} placeholder="What actually happened? Did price do what you expected?" />
        <textarea rows={3} value={f.lesson} onChange={(e) => set({ lesson: e.target.value })} placeholder="Lesson: what will you do differently next time?" />
      </section>

      <section className="jr-sec">
        <h4>Comments</h4>
        {item.comments.length === 0 && <div className="muted">No comments yet. Ask Claude to review this entry, or add your own.</div>}
        {item.comments.map((c, i) => (
          <div key={i} className={'jr-comment ' + c.by}>
            <div className="jr-c-head">{c.by === 'claude' ? <><Sparkles size={12} /> Claude</> : 'You'} <span className="muted">· {formatDateTime(c.at)}</span></div>
            <div className="md"><Markdown remarkPlugins={[remarkGfm]}>{c.text}</Markdown></div>
          </div>
        ))}
        <div className="jr-add"><input value={comment} placeholder="Add a comment…" onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} /><button className="btn" disabled={!comment.trim()} onClick={addComment}>Add</button></div>
      </section>
    </div>
  )
}

export default function JournalView({ symbol, focusId, onOpenChart, onOpenTicket, onAskClaude }: {
  symbol: string; focusId: number | null; onOpenChart: (s: string) => void; onOpenTicket: (e: JournalItem) => void; onAskClaude: (t: string) => void
}) {
  const [items, setItems] = useState<JournalItem[]>([])
  const [selId, setSelId] = useState<number | null>(null)
  const [chip, setChip] = useState<Chip>('all')
  const [q, setQ] = useState('')

  const load = useCallback(() => window.api.journal.list({ limit: 500 }).then(setItems), [])
  useEffect(() => { load(); return window.api.journal.onChanged(load) }, [load])
  useEffect(() => { if (focusId != null) { setSelId(focusId); setChip('all'); setQ('') } }, [focusId])
  useEffect(() => { if (selId == null && items.length) setSelId(items[0].id) }, [items, selId])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return items.filter((e) => matches(e, chip) && (!t || [e.title, e.symbol, e.body, e.setup, e.review, e.lesson, e.tags.join(' ')].join(' ').toLowerCase().includes(t)))
  }, [items, chip, q])
  const stats = useMemo(() => {
    const closed = items.filter((e) => e.trade.state === 'closed')
    const wins = closed.filter((e) => (e.trade.realizedPl ?? 0) > 0).length
    const rs = closed.map((e) => e.trade.rMultiple).filter((r): r is number => r != null)
    return { closed: closed.length, winRate: closed.length ? (wins / closed.length) * 100 : null, net: closed.reduce((s, e) => s + (e.trade.realizedPl ?? 0), 0), avgR: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null }
  }, [items])
  const sel = items.find((e) => e.id === selId) ?? null

  const create = async (kind: 'trade' | 'note') => {
    const e = await window.api.journal.create({ kind, symbol: kind === 'trade' ? symbol : null, title: kind === 'trade' ? `${symbol} trade` : 'New note', status: 'idea' })
    setChip('all'); setQ(''); setSelId(e.id)
  }

  return (
    <div className="col">
      <div className="pane-title"><span>Trading Journal</span><span className="spacer" />
        <button className="btn small" onClick={() => create('trade')}><Plus size={13} /> New entry</button>
        <button className="btn small" onClick={() => create('note')} style={{ marginLeft: 6 }}>New note</button>
      </div>
      <div className="jr">
        <div className="jr-list">
          <div className="jr-stats">
            <div><span>Closed trades</span><b>{stats.closed}</b></div>
            <div><span>Win rate</span><b>{stats.winRate != null ? `${stats.winRate.toFixed(0)}%` : '—'}</b></div>
            <div><span>Net P/L</span><b className={stats.net >= 0 ? 'up' : 'down'}>{stats.closed ? plText(stats.net) : '—'}</b></div>
            <div><span>Avg R</span><b>{stats.avgR != null ? rText(stats.avgR) : '—'}</b></div>
          </div>
          <div className="search-box jr-search"><Search size={14} strokeWidth={1.5} /><input style={{ textTransform: 'none' }} placeholder="Search journal…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="jr-filters">{CHIPS.map(([id, l]) => <button key={id} className={'tk-chip' + (chip === id ? ' on' : '')} onClick={() => setChip(id)}>{l}</button>)}</div>
          <div className="jr-rows">
            {shown.length === 0 && <div className="pad muted">{items.length === 0 ? 'Nothing here yet. Record why you take a trade with the “Record in journal” box on the order ticket, ask Claude for trade ideas, or add an entry yourself.' : 'No entries match.'}</div>}
            {shown.map((e) => {
              const [label, cls] = badge(e)
              return (
                <div key={e.id} className={'jr-row' + (e.id === selId ? ' sel' : '')} onClick={() => setSelId(e.id)}>
                  <div className="jr-r1"><b>{e.symbol ?? '—'}</b>{e.direction && <span className="muted"> {e.direction}</span>}<span className="spacer" />{e.source === 'claude' && <Sparkles size={12} className="jr-spark" />}<span className={'jr-badge ' + cls}>{label}</span></div>
                  <div className="jr-r2">{e.title}</div>
                  <div className="jr-r3 muted"><span>{formatDateTime(e.created_at)}</span><span className="spacer" />
                    {e.trade.realizedPl != null && <span className={e.trade.realizedPl >= 0 ? 'up' : 'down'}>{plText(e.trade.realizedPl)} {rText(e.trade.rMultiple)}</span>}</div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="jr-pane">{sel ? <Detail key={sel.id} item={sel} onOpenChart={onOpenChart} onOpenTicket={onOpenTicket} onAskClaude={onAskClaude} onDeleted={() => setSelId(null)} /> : <div className="pad muted">Select an entry, or create one.</div>}</div>
      </div>
    </div>
  )
}
