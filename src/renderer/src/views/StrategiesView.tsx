import { useEffect, useMemo, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BookOpen, Copy, MessageSquare, Pencil, Plus, Search, Sparkles, Trash2, Wand2, Target, HelpCircle, ListChecks } from 'lucide-react'
import { BUILTIN_STRATEGIES } from '../data/strategies'
import { describeSetup, setupFromSettings } from '../chart/setup'
import { INTERVALS, isBlocked, type Interval } from '../chart/timeframe'
import type { ChartSettings } from '../chart/settings'
import { CATEGORIES, PROGRESS_LABEL, type ChartSetup, type CustomDocInput, type Level, type Progress, type StrategyDoc, type StrategyProgress } from '../../../shared/strategies'
import { toast } from '../toast'
import CandlePatterns from '../components/CandlePatterns'

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
const STATES: Progress[] = ['new', 'learning', 'practiced', 'confident']

function SetupCard({ setup }: { setup: ChartSetup }) {
  const d = describeSetup(setup)
  return <div className="st-setup"><div><span className="muted">Timeframe</span><b>{d.range} · {d.interval} bars</b></div><div><span className="muted">Studies</span><b>{d.studies.join(' · ') || 'none'}</b></div></div>
}

function Quiz({ quiz }: { quiz: StrategyDoc['quiz'] }) {
  const [open, setOpen] = useState<Set<number>>(new Set())
  return (
    <div className="st-quiz">{quiz.map((x, i) => (
      <div key={i} className="st-q"><div><b>{i + 1}.</b> {x.q}</div>
        {open.has(i) ? <div className="st-a">{x.a}</div> : <button className="btn small" onClick={() => setOpen(new Set(open).add(i))}>Show answer</button>}</div>
    ))}</div>
  )
}

function Editor({ initial, currentSetup, onSave, onCancel }: { initial: StrategyDoc | null; currentSetup: ChartSetup; onSave: (d: CustomDocInput) => void; onCancel: () => void }) {
  const [f, setF] = useState<CustomDocInput>(() => ({ title: initial?.title ?? '', category: initial?.category ?? 'My strategies', level: initial?.level ?? 'beginner', minutes: initial?.minutes ?? 10, summary: initial?.summary ?? '', tags: initial?.tags ?? [], body: initial?.body ?? '## The idea\n\n## Rules\n- Entry:\n- Stop:\n- Target:\n\n## Common mistakes\n\n## Practice\n', quiz: initial?.quiz ?? [], chartSetup: initial?.chartSetup ?? null }))
  const set = (p: CustomDocInput) => setF({ ...f, ...p })
  const quiz = f.quiz ?? []
  return (
    <div className="st-edit">
      <div className="st-grid">
        <label className="wide">Title<input value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Gap fade on large caps" /></label>
        <label>Category<select value={f.category} onChange={(e) => set({ category: e.target.value as StrategyDoc['category'] })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Level<select value={f.level} onChange={(e) => set({ level: e.target.value as Level })}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
        <label>Minutes to read<input type="number" min={1} value={f.minutes} onChange={(e) => set({ minutes: Number(e.target.value) })} /></label>
        <label>Tags<input value={(f.tags ?? []).join(', ')} onChange={(e) => set({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} placeholder="comma separated" /></label>
        <label className="wide">One-line summary<input value={f.summary} onChange={(e) => set({ summary: e.target.value })} /></label>
      </div>
      <label className="st-lbl">Document (Markdown)</label>
      <textarea rows={16} value={f.body} onChange={(e) => set({ body: e.target.value })} />
      <label className="st-lbl">Chart setup</label>
      <div className="st-row">{f.chartSetup ? <SetupCard setup={f.chartSetup} /> : <span className="muted">None. The "Set up my chart" button is hidden.</span>}
        <button className="btn small" onClick={() => set({ chartSetup: currentSetup })}>Use my current chart</button>{f.chartSetup && <button className="btn small" onClick={() => set({ chartSetup: null })}>Clear</button>}</div>
      <label className="st-lbl">Check-yourself questions</label>
      {quiz.map((x, i) => (
        <div key={i} className="st-qe"><input placeholder="Question" value={x.q} onChange={(e) => set({ quiz: quiz.map((y, j) => (j === i ? { ...y, q: e.target.value } : y)) })} />
          <input placeholder="Answer" value={x.a} onChange={(e) => set({ quiz: quiz.map((y, j) => (j === i ? { ...y, a: e.target.value } : y)) })} />
          <button className="icon-btn" onClick={() => set({ quiz: quiz.filter((_, j) => j !== i) })}><Trash2 size={13} /></button></div>
      ))}
      <button className="btn small" onClick={() => set({ quiz: [...quiz, { q: '', a: '' }] })}><Plus size={12} /> Add question</button>
      <div className="st-actions"><button className="btn primary" disabled={!f.title?.trim()} onClick={() => onSave(f)}>Save</button><button className="btn" onClick={onCancel}>Cancel</button></div>
    </div>
  )
}

export default function StrategiesView({ symbol, chartSettings, onApplyChart, onAskClaude }: {
  symbol: string; chartSettings: ChartSettings; onApplyChart: (setup: ChartSetup, name: string) => void; onAskClaude: (t: string) => void
}) {
  const [custom, setCustom] = useState<StrategyDoc[]>([])
  const [progress, setProgress] = useState<Record<string, StrategyProgress>>({})
  const [sel, setSel] = useState<string>(BUILTIN_STRATEGIES[0].id)
  const [q, setQ] = useState('')
  const [level, setLevel] = useState<'all' | Level>('all')
  const [editing, setEditing] = useState<{ doc: StrategyDoc | null } | null>(null)
  const [note, setNote] = useState('')
  const noteDirty = useRef(false)

  const load = () => { window.api.strategies.list().then(setCustom); window.api.strategies.progress().then((p) => setProgress(Object.fromEntries(p.map((x) => [x.id, x])))) }
  useEffect(() => { load(); return window.api.strategies.onChanged(load) }, [])

  const all = useMemo(() => [...BUILTIN_STRATEGIES, ...custom], [custom])
  const doc = all.find((d) => d.id === sel) ?? all[0]
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return all.filter((d) => (level === 'all' || d.level === level) && (!t || `${d.title} ${d.summary} ${d.tags.join(' ')} ${d.category}`.toLowerCase().includes(t)))
  }, [all, q, level])
  const status = (id: string): Progress => progress[id]?.status ?? 'new'
  const done = all.filter((d) => ['practiced', 'confident'].includes(status(d.id))).length

  useEffect(() => { setNote(progress[doc.id]?.note ?? ''); noteDirty.current = false }, [doc.id, progress[doc.id]?.updated_at])
  useEffect(() => {
    if (!noteDirty.current) return
    const t = setTimeout(() => { window.api.strategies.setProgress(doc.id, { note }); noteDirty.current = false }, 700)
    return () => clearTimeout(t)
  }, [note])

  const setStatus = (s: Progress) => window.api.strategies.setProgress(doc.id, { status: s })
  const ask = (text: string) => onAskClaude(text)
  const T = doc.title
  const teach = () => ask(`I want to learn the "${T}" strategy (document id ${doc.id}). Use get_strategy to read the document and my progress, then teach me step by step in short chunks: start with the core idea, then ask me one question to check I understood before moving on. Use my chart where it helps (apply_strategy_chart, find_swings, mark_bar). Do not dump the whole document at once.`)
  const quiz = () => ask(`Quiz me on "${T}" (document id ${doc.id}). Read it with get_strategy, then ask me one question at a time (use its check-yourself questions plus a few of your own that apply the idea to a chart), wait for my answer, and give honest feedback. At the end tell me my score and, if I agree, record it with update_strategy_progress.`)
  const example = () => ask(`Find real examples of the "${T}" setup (document id ${doc.id}) on the ${symbol} chart. Use apply_strategy_chart to set the chart up, read the data with the chart tools, mark what you find with mark_bar and lines, and explain each one. If the setup is not actually present, say so plainly instead of forcing an example.`)
  const plan = () => ask(`Walk me through a practice trade plan using the "${T}" strategy (document id ${doc.id}) on ${symbol}. Check whether the setup is actually present. If it is, use get_risk_rules and calculate_position_size for the size and explain the stop, target and what would prove it wrong; prepare an order ticket only if I agree. If it is not present, tell me what you would wait for.`)
  const simple = () => ask(`Explain the "${T}" strategy (document id ${doc.id}) in plain words as if I am completely new, using a real example from the ${symbol} chart.`)
  const write = () => ask('Help me write my own strategy document. Ask me a few questions about the idea (what I look for, entry, stop, target, timeframe), then create it with create_strategy_doc including a chart setup and a few check-yourself questions.')

  const save = async (d: CustomDocInput) => {
    if (editing?.doc) { await window.api.strategies.update(editing.doc.id, d); toast.success('Strategy saved') }
    else { const c = await window.api.strategies.create({ ...d, source: 'user' }); setSel(c.id); toast.success('Strategy created') }
    setEditing(null); load()
  }
  const duplicate = async () => { const c = await window.api.strategies.create({ title: `My version of ${doc.title}`, category: doc.category, level: doc.level, minutes: doc.minutes, summary: doc.summary, tags: doc.tags, body: doc.body, quiz: doc.quiz, chartSetup: doc.chartSetup, source: 'user' }); setSel(c.id); setEditing({ doc: c }); load() }
  const del = async () => { if (!window.confirm(`Delete “${doc.title}”? This cannot be undone.`)) return; await window.api.strategies.remove(doc.id); setSel(BUILTIN_STRATEGIES[0].id); toast.info('Strategy deleted'); load() }

  return (
    <div className="col">
      <div className="pane-title"><span>Trading Strategies</span><span className="spacer" />
        <button className="btn small" onClick={write}><Sparkles size={12} /> Ask Claude to write one</button>
        <button className="btn small" style={{ marginLeft: 6 }} onClick={() => setEditing({ doc: null })}><Plus size={12} /> New strategy</button></div>
      <div className="jr">
        <div className="jr-list st-list">
          <div className="st-prog"><b>{done}</b> of {all.length} practiced or confident<div className="cx-bar"><i style={{ width: `${(done / all.length) * 100}%` }} /></div></div>
          <div className="search-box jr-search"><Search size={14} strokeWidth={1.5} /><input style={{ textTransform: 'none' }} placeholder="Search strategies…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="jr-filters">{(['all', ...LEVELS] as const).map((l) => <button key={l} className={'tk-chip' + (level === l ? ' on' : '')} onClick={() => setLevel(l)}>{l === 'all' ? 'All levels' : l}</button>)}</div>
          <div className="jr-rows">
            {CATEGORIES.map((cat) => {
              const items = shown.filter((d) => d.category === cat)
              if (!items.length) return null
              return (
                <div key={cat}><div className="st-cat">{cat}</div>
                  {items.map((d) => (
                    <div key={d.id} className={'jr-row' + (d.id === doc.id ? ' sel' : '')} onClick={() => { setSel(d.id); setEditing(null) }}>
                      <div className="jr-r1"><i className={'st-dot ' + status(d.id)} title={PROGRESS_LABEL[status(d.id)]} /><b className="st-title">{d.title}</b>{d.source === 'claude' && <Sparkles size={12} className="jr-spark" />}{d.source === 'user' && <Pencil size={11} className="muted" />}</div>
                      <div className="jr-r3 muted"><span>{d.level}</span><span>· {d.minutes} min</span></div>
                    </div>
                  ))}</div>
              )
            })}
            {shown.length === 0 && <div className="pad muted">No strategies match.</div>}
          </div>
        </div>

        <div className="jr-pane">
          {editing ? <Editor key={editing.doc?.id ?? 'new'} initial={editing.doc} currentSetup={setupFromSettings(chartSettings)} onSave={save} onCancel={() => setEditing(null)} /> : (
            <div className="jr-detail st-detail">
              <h2 className="st-h">{doc.title}</h2>
              <div className="st-meta"><span className={'jr-badge ' + (doc.level === 'beginner' ? 'closed' : doc.level === 'intermediate' ? 'open' : 'idea')}>{doc.level}</span><span className="muted">{doc.category} · {doc.minutes} min read</span>
                {doc.source === 'claude' && <span className="jr-badge claude"><Sparkles size={11} /> written by Claude</span>}{doc.source === 'user' && <span className="jr-badge note">my strategy</span>}</div>
              <p className="st-sum">{doc.summary}</p>
              <div className="st-progress"><span className="muted">My progress</span>
                <div className="seg">{STATES.map((s) => <button key={s} className={status(doc.id) === s ? 'on' : ''} onClick={() => setStatus(s)}>{PROGRESS_LABEL[s]}</button>)}</div>
                {progress[doc.id]?.quiz_score != null && <span className="muted">last quiz: <b>{progress[doc.id].quiz_score}%</b></span>}</div>
              <div className="st-actions">
                {doc.chartSetup && !isBlocked(doc.chartSetup.interval as Interval) && <button className="btn primary" onClick={() => onApplyChart(doc.chartSetup!, doc.title)}><Wand2 size={13} /> Set up my chart</button>}
                {doc.chartSetup && isBlocked(doc.chartSetup.interval as Interval) && <span className="muted">This guide needs {INTERVALS.find((x) => x.id === doc.chartSetup!.interval)?.label ?? doc.chartSetup.interval} bars, which your FMP plan does not include.</span>}
                <button className="btn" onClick={teach}><BookOpen size={13} /> Teach me this</button>
                <button className="btn" onClick={quiz}><HelpCircle size={13} /> Quiz me</button>
                <button className="btn" onClick={example}><Target size={13} /> Find an example</button>
                <button className="btn" onClick={plan}><ListChecks size={13} /> Practice plan</button>
                <button className="btn" onClick={simple}><MessageSquare size={13} /> Explain simply</button>
              </div>
              <div className="md st-body"><Markdown remarkPlugins={[remarkGfm]}>{doc.body}</Markdown></div>
              {doc.id === 'candlestick-patterns' && <CandlePatterns symbol={symbol} onAskClaude={ask} />}
              {doc.chartSetup && <section className="jr-sec"><h4>Chart setup</h4><SetupCard setup={doc.chartSetup} /></section>}
              {doc.quiz.length > 0 && <section className="jr-sec"><h4>Check yourself</h4><Quiz key={doc.id} quiz={doc.quiz} /></section>}
              <section className="jr-sec"><h4>My notes</h4>
                <textarea rows={4} value={note} placeholder="What clicked, what confused you, examples you found…" onChange={(e) => { noteDirty.current = true; setNote(e.target.value) }} /></section>
              <div className="st-actions">
                {doc.source === 'builtin' ? <button className="btn" onClick={duplicate}><Copy size={13} /> Copy to edit</button> : <>
                  <button className="btn" onClick={() => setEditing({ doc })}><Pencil size={13} /> Edit</button><button className="btn" onClick={del}><Trash2 size={13} /> Delete</button></>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
