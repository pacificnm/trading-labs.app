export type Level = 'beginner' | 'intermediate' | 'advanced'
export const CATEGORIES = ['Foundations', 'Trend', 'Breakouts', 'Mean reversion & momentum', 'Intraday', 'Events & options', 'My strategies'] as const
export type Category = (typeof CATEGORIES)[number]
export type Progress = 'new' | 'learning' | 'practiced' | 'confident'
export const PROGRESS_LABEL: Record<Progress, string> = { new: 'Not started', learning: 'Learning', practiced: 'Practiced', confident: 'Confident' }

/** A chart the strategy is meant to be studied on. `study` ids are the ones on the Add-study list. */
export interface ChartSetup {
  range: string
  interval: string
  type?: string
  studies: { study: string; params?: Record<string, number> }[]
}

export interface StrategyDoc {
  id: string
  title: string
  category: Category
  level: Level
  minutes: number
  summary: string
  tags: string[]
  /** markdown */
  body: string
  quiz: { q: string; a: string }[]
  chartSetup: ChartSetup | null
  source: 'builtin' | 'user' | 'claude'
  created_at?: number
  updated_at?: number
}

export interface StrategyProgress { id: string; status: Progress; note: string; quiz_score: number | null; updated_at: number }
export type CustomDocInput = Partial<Omit<StrategyDoc, 'id' | 'source' | 'created_at' | 'updated_at'>> & { source?: 'user' | 'claude' }
