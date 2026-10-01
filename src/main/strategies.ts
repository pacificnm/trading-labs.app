import type { DatabaseSync } from 'node:sqlite'
import { CATEGORIES, type ChartSetup, type CustomDocInput, type Progress, type StrategyDoc, type StrategyProgress } from '../shared/strategies'

type Row = Record<string, unknown>
const json = <T>(v: unknown, dflt: T): T => { try { return v ? (JSON.parse(String(v)) as T) : dflt } catch { return dflt } }
const str = (v: unknown, max: number) => String(v ?? '').slice(0, max)
const STATUSES: Progress[] = ['new', 'learning', 'practiced', 'confident']

function toDoc(r: Row): StrategyDoc {
  return {
    id: r.id as string, title: r.title as string, category: r.category as StrategyDoc['category'], level: r.level as StrategyDoc['level'], minutes: r.minutes as number,
    summary: r.summary as string, tags: json<string[]>(r.tags, []), body: r.body as string, quiz: json(r.quiz, []), chartSetup: json<ChartSetup | null>(r.chart_setup, null),
    source: r.source as 'user' | 'claude', created_at: r.created_at as number, updated_at: r.updated_at as number
  }
}

const cleanQuiz = (v: unknown): { q: string; a: string }[] =>
  Array.isArray(v) ? v.flatMap((x) => (x && typeof x === 'object' && (x as Row).q && (x as Row).a ? [{ q: str((x as Row).q, 400), a: str((x as Row).a, 1200) }] : [])).slice(0, 12) : []
const cleanSetup = (v: unknown): ChartSetup | null => {
  if (!v || typeof v !== 'object') return null
  const o = v as Row
  if (typeof o.range !== 'string' || typeof o.interval !== 'string' || !Array.isArray(o.studies)) return null
  return {
    range: o.range, interval: o.interval, ...(typeof o.type === 'string' ? { type: o.type } : {}),
    studies: (o.studies as Row[]).flatMap((s) => (typeof s?.study === 'string' ? [{ study: s.study, ...(s.params && typeof s.params === 'object' ? { params: s.params as Record<string, number> } : {}) }] : [])).slice(0, 10)
  }
}
const cleanTags = (v: unknown) => (Array.isArray(v) ? [...new Set(v.map((t) => String(t).trim().replace(/^#/, '').slice(0, 30)).filter(Boolean))].slice(0, 10) : [])

/** User- and Claude-written strategy documents, plus learning progress for every document (built-in ones too). */
export function createStrategies(db: DatabaseSync, clock: () => number = () => Math.floor(Date.now() / 1000), uid: () => string = () => crypto.randomUUID()) {
  const all = (sql: string, ...a: (string | number | null)[]) => db.prepare(sql).all(...a) as Row[]
  const one = (sql: string, ...a: (string | number | null)[]) => db.prepare(sql).get(...a) as Row | undefined

  const list = (): StrategyDoc[] => all('SELECT * FROM strategy_docs ORDER BY updated_at DESC').map(toDoc)
  const get = (id: string): StrategyDoc | null => { const r = one('SELECT * FROM strategy_docs WHERE id = ?', id); return r ? toDoc(r) : null }

  function create(input: CustomDocInput): StrategyDoc {
    const now = clock(), id = 'custom-' + uid()
    const title = str(input.title, 120).trim() || 'Untitled strategy'
    const category = CATEGORIES.includes(input.category as never) ? input.category! : 'My strategies'
    db.prepare(`INSERT INTO strategy_docs (id, title, category, level, minutes, summary, tags, body, quiz, chart_setup, source, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, title, category, ['beginner', 'intermediate', 'advanced'].includes(input.level as string) ? input.level! : 'beginner', Math.max(1, Math.min(240, Math.round(input.minutes ?? 10))),
      str(input.summary, 400), JSON.stringify(cleanTags(input.tags)), str(input.body, 60000), JSON.stringify(cleanQuiz(input.quiz)),
      cleanSetup(input.chartSetup) ? JSON.stringify(cleanSetup(input.chartSetup)) : null, input.source === 'claude' ? 'claude' : 'user', now, now)
    return get(id)!
  }

  function update(id: string, p: CustomDocInput): StrategyDoc | null {
    if (!get(id)) return null
    const set: string[] = ['updated_at = ?'], args: (string | number | null)[] = [clock()]
    const put = (c: string, v: string | number | null) => { set.push(`${c} = ?`); args.push(v) }
    if (p.title !== undefined) put('title', str(p.title, 120).trim() || 'Untitled strategy')
    if (p.category !== undefined && CATEGORIES.includes(p.category as never)) put('category', p.category)
    if (p.level !== undefined && ['beginner', 'intermediate', 'advanced'].includes(p.level)) put('level', p.level)
    if (p.minutes !== undefined) put('minutes', Math.max(1, Math.min(240, Math.round(p.minutes))))
    if (p.summary !== undefined) put('summary', str(p.summary, 400))
    if (p.tags !== undefined) put('tags', JSON.stringify(cleanTags(p.tags)))
    if (p.body !== undefined) put('body', str(p.body, 60000))
    if (p.quiz !== undefined) put('quiz', JSON.stringify(cleanQuiz(p.quiz)))
    if (p.chartSetup !== undefined) put('chart_setup', cleanSetup(p.chartSetup) ? JSON.stringify(cleanSetup(p.chartSetup)) : null)
    db.prepare(`UPDATE strategy_docs SET ${set.join(', ')} WHERE id = ?`).run(...args, id)
    return get(id)
  }

  const remove = (id: string) => { db.prepare('DELETE FROM strategy_docs WHERE id = ?').run(id); db.prepare('DELETE FROM strategy_progress WHERE id = ?').run(id) }

  const toProgress = (r: Row): StrategyProgress => ({ id: r.id as string, status: r.status as Progress, note: r.note as string, quiz_score: (r.quiz_score as number) ?? null, updated_at: r.updated_at as number })
  const progress = (): StrategyProgress[] => all('SELECT * FROM strategy_progress').map(toProgress)
  function setProgress(id: string, p: { status?: Progress; note?: string; quiz_score?: number | null }): StrategyProgress {
    const cur = one('SELECT * FROM strategy_progress WHERE id = ?', id)
    const status = p.status !== undefined && STATUSES.includes(p.status) ? p.status : ((cur?.status as Progress) ?? 'new')
    const note = p.note !== undefined ? str(p.note, 8000) : ((cur?.note as string) ?? '')
    const score = p.quiz_score !== undefined ? (p.quiz_score == null ? null : Math.max(0, Math.min(100, Math.round(p.quiz_score)))) : ((cur?.quiz_score as number) ?? null)
    db.prepare('INSERT INTO strategy_progress (id, status, note, quiz_score, updated_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status = excluded.status, note = excluded.note, quiz_score = excluded.quiz_score, updated_at = excluded.updated_at').run(id, status, note, score, clock())
    return toProgress(one('SELECT * FROM strategy_progress WHERE id = ?', id)!)
  }
  return { list, get, create, update, remove, progress, setProgress }
}
export type Strategies = ReturnType<typeof createStrategies>
