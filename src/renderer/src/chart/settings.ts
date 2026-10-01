import type { Interval, Range } from './timeframe'

export type ChartType = 'candles' | 'hollow' | 'bars' | 'line' | 'area' | 'heikin'
export type ScaleMode = 'normal' | 'log' | 'percent'

export interface StudyInstance {
  uid: string
  studyId: string
  params: Record<string, number>
  visible: boolean
  /** colour overrides by output name ("SMA", "Upper", "MACD"...); two-tone outputs use "Name:up" and "Name:down" */
  colors?: Record<string, string>
}

export interface ChartSettings {
  range: Range
  interval: Interval
  type: ChartType
  scale: ScaleMode
  grid: boolean
  crosshair: 'normal' | 'magnet'
  upColor: string
  downColor: string
  studies: StudyInstance[]
}

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  range: '1Y',
  interval: '1day',
  type: 'candles',
  scale: 'normal',
  grid: true,
  crosshair: 'normal',
  upColor: '#26a69a',
  downColor: '#ef5350',
  studies: [{ uid: 'default-volume', studyId: 'volume', params: {}, visible: true }]
}
