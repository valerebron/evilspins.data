// ─── Playing card ─────────────────────────────────────────────────────────────

export type CardSuit = '♠' | '♣' | '♦' | '♥'
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

// ─── DB row shape (mirrors the cards table) ──────────────────────────

export interface Card {
  id: number
  esid: string
  year: number
  month: number
  day: number
  hour: number
  artist: string
  title: string
  slug: string
  suit: string
  rank: string
  url_audio: string
  url_image: string
  blurhash?: string
  file_mtime: number
  file_size: number
  created_at: Date
  updated_at: Date
}
