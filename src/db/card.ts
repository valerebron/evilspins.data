import { pool } from './pool'
import type { Card } from '../types'

export async function getAllCard(limit = 1000, offset = 0): Promise<Card[]> {
  const { rows } = await pool.query(`SELECT * FROM card ORDER BY year, month, day, hour LIMIT $1 OFFSET $2`, [limit, offset])
  return rows as Card[]
}

export async function getCardById(id: number): Promise<Card | null> {
  const { rows } = await pool.query(`SELECT * FROM card WHERE id = $1`, [id])
  return rows[0] ?? null
}

export async function getCardByEsid(esid: string): Promise<Card | null> {
  const { rows } = await pool.query(`SELECT * FROM card WHERE esid = $1`, [esid])
  return rows[0] ?? null
}

export async function getCardBySlug(slug: string): Promise<Card | null> {
  const { rows } = await pool.query(`SELECT * FROM card WHERE slug = $1`, [slug])
  return rows[0] ?? null
}

export async function getCardByDate(year: number, month: number, day: number, hour: number): Promise<Card[]> {
  const { rows } = await pool.query(`SELECT * FROM card WHERE year = $1 AND month = $2 AND day = $3 AND hour = $4`, [year, month, day, hour])
  return rows as Card[]
}

export async function getCardByStem(stem: string): Promise<Card | null> {
  const { rows } = await pool.query(`SELECT * FROM card WHERE stem = $1`, [stem])
  return rows[0] ?? null
}

export async function getCardBySuitAndRank(suit: string, rank: string): Promise<Card[]> {
  const { rows } = await pool.query(`SELECT * FROM card WHERE suit = $1 AND rank = $2 ORDER BY year, month, day, hour`, [suit, rank])
  return rows as Card[]
}

export async function getClubsJacks(): Promise<Card[]> {
  const { rows } = await pool.query(`SELECT * FROM card WHERE suit = '♣' AND rank = 'V' ORDER BY year, month, day, hour`)
  return rows as Card[]
}

export async function getAllStoredMtimes(): Promise<Map<string, number>> {
  const { rows } = await pool.query(`SELECT stem, file_mtime FROM card`)
  return new Map(rows.map((r: { stem: string; file_mtime: string | number }) => [r.stem, Number(r.file_mtime)]))
}

export async function getCardCount(): Promise<number> {
  const { rows } = await pool.query(`SELECT COUNT(*) AS count FROM card`)
  return Number(rows[0]?.count ?? 0)
}

export async function getCards(options: {
  search?: string
  suit?: string
  rank?: string
  year?: number
  limit: number
  offset: number
}): Promise<Card[]> {
  const { search, suit, rank, year, limit, offset } = options
  const clauses: string[] = []
  const values: Array<string | number> = []

  if (search) {
    const searchValue = `%${search}%`
    values.push(searchValue, searchValue, searchValue)
    clauses.push(`(artist ILIKE $${values.length - 2} OR title ILIKE $${values.length - 1} OR slug ILIKE $${values.length})`)
  }

  if (suit) {
    values.push(suit)
    clauses.push(`suit = $${values.length}`)
  }

  if (rank) {
    values.push(rank)
    clauses.push(`rank = $${values.length}`)
  }

  if (year !== undefined) {
    values.push(year)
    clauses.push(`year = $${values.length}`)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const query = `SELECT * FROM card ${where} ORDER BY year, month, day, hour LIMIT $${values.length + 1} OFFSET $${values.length + 2}`
  const { rows } = await pool.query(query, [...values, limit, offset])
  return rows as Card[]
}

export async function getFilteredCardCount(options: {
  search?: string
  suit?: string
  rank?: string
  year?: number
}): Promise<number> {
  const { search, suit, rank, year } = options
  const clauses: string[] = []
  const values: Array<string | number> = []

  if (search) {
    const searchValue = `%${search}%`
    values.push(searchValue, searchValue, searchValue)
    clauses.push(`(artist ILIKE $${values.length - 2} OR title ILIKE $${values.length - 1} OR slug ILIKE $${values.length})`)
  }

  if (suit) {
    values.push(suit)
    clauses.push(`suit = $${values.length}`)
  }

  if (rank) {
    values.push(rank)
    clauses.push(`rank = $${values.length}`)
  }

  if (year !== undefined) {
    values.push(year)
    clauses.push(`year = $${values.length}`)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const { rows } = await pool.query(`SELECT COUNT(*) AS count FROM card ${where}`, values)
  return Number(rows[0]?.count ?? 0)
}

export async function getLatestCards(limit: number): Promise<Card[]> {
  const { rows } = await pool.query(`SELECT * FROM card ORDER BY created_at DESC LIMIT $1`, [limit])
  return rows as Card[]
}

export async function upsertCard(card: Omit<Card, 'id' | 'updated_at'>): Promise<void> {
  await pool.query(`INSERT INTO card
       (esid, stem, year, month, day, hour, artist, title, slug, suit, rank, ext_audio, ext_image, blurhash, file_mtime, file_size, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, now())
     ON CONFLICT (esid) DO UPDATE SET
       stem      = EXCLUDED.stem,
       artist    = EXCLUDED.artist,
       title     = EXCLUDED.title,
       slug      = EXCLUDED.slug,
       suit      = EXCLUDED.suit,
       rank      = EXCLUDED.rank,
       ext_audio = EXCLUDED.ext_audio,
       ext_image = EXCLUDED.ext_image,
       blurhash  = EXCLUDED.blurhash,
       file_mtime = EXCLUDED.file_mtime,
       file_size = EXCLUDED.file_size,
       updated_at = now()`, [
    card.esid,
    card.stem,
    card.year,
    card.month,
    card.day,
    card.hour,
    card.artist,
    card.title,
    card.slug,
    card.suit,
    card.rank,
    card.ext_audio,
    card.ext_image,
    card.blurhash,
    card.file_mtime,
    card.file_size,
    card.created_at,
  ])
}

export async function deleteCardByEsid(esid: string): Promise<void> {
  await pool.query(`DELETE FROM card WHERE esid = $1`, [esid])
}
