export type JournalKind = 'trade' | 'note'
/** idea = considered/suggested, taken = orders were placed, skipped = decided against */
export type JournalStatus = 'idea' | 'taken' | 'skipped'
export type TradeState = 'none' | 'working' | 'open' | 'closed' | 'cancelled'
export type FollowedPlan = 'yes' | 'partly' | 'no'

export interface JournalComment { by: 'user' | 'claude'; at: number; text: string }

export interface JournalEntry {
  id: number
  created_at: number
  updated_at: number
  kind: JournalKind
  status: JournalStatus
  source: 'user' | 'claude'
  symbol: string | null
  direction: 'long' | 'short' | null
  title: string
  /** why: the thesis / reasoning behind the trade */
  body: string
  setup: string
  tags: string[]
  plan_entry: number | null
  plan_stop: number | null
  plan_target: number | null
  plan_qty: number | null
  emotions: string[]
  followed_plan: FollowedPlan | null
  /** what happened */
  review: string
  lesson: string
  order_ids: number[]
  comments: JournalComment[]
  has_image: boolean
}

/** Outcome of the linked orders, computed from real fills. */
export interface JournalTrade {
  state: TradeState
  qty: number | null
  entryPrice: number | null
  exitPrice: number | null
  realizedPl: number | null
  plannedRisk: number | null
  rMultiple: number | null
  openedAt: number | null
  closedAt: number | null
}
export interface JournalItem extends JournalEntry { trade: JournalTrade }

export type JournalEditable = Partial<Pick<JournalEntry, 'kind' | 'status' | 'symbol' | 'direction' | 'title' | 'body' | 'setup' | 'tags' | 'plan_entry' | 'plan_stop' | 'plan_target' | 'plan_qty' | 'emotions' | 'followed_plan' | 'review' | 'lesson' | 'order_ids'>> & { image?: string | null }
export interface JournalFilter { status?: JournalStatus; symbol?: string; q?: string; source?: 'user' | 'claude'; limit?: number }

export const EMOTIONS = ['Calm', 'Confident', 'Patient', 'Anxious', 'FOMO', 'Greedy', 'Fearful', 'Frustrated', 'Impulsive']
