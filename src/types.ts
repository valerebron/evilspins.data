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

export interface Tape {
  id: string;
  name: string;
  duration: number;
  createdAt?: Date;
}

export interface Side {
  id: number;
  tapeId: string;
  side: string;
  duration: number;
}

export interface Artist {
  id: number;
  name: string;
  url?: string;
  coverUrl?: string;
  createdAt?: Date;
}

export interface Tarot {
  id: number
  esid: string
  tape_id: string
  side: string
  track_order: number
  title: string
  artist_id: number
  start: number
  link?: string
  url_audio: string
  url_image?: string
  url_tarot: string
  created_at: Date
  updated_at: Date
}
