// ─── Playing card ─────────────────────────────────────────────────────────────

export type CardSuit = '♠' | '♣' | '♦' | '♥'
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'V' | 'D' | 'R'

// ─── DB row shape (mirrors the card table) ──────────────────────────

export interface Card {
  id: number
  esid: string
  stem: string | null
  year: number
  month: number
  day: number
  hour: number
  artist: string
  title: string
  slug: string
  suit: string
  rank: string
  ext_audio: string
  ext_image: string
  blurhash: string | null
  file_mtime: number
  file_size: number
  created_at: Date
  updated_at: Date
}
