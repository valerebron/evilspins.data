import { pool } from './pool'
import type { Card } from '../types'

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getAllCard(): Promise<Card[]> {
  const { rows } = await pool.query<Card>(
    `SELECT * FROM card ORDER BY year, month, day, hour`,
  )
  return rows
}

export async function getCardById(id: number): Promise<Card | null> {
  const { rows } = await pool.query<Card>(
    `SELECT * FROM card WHERE id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function getCardByEsid(esid: string): Promise<Card | null> {
  const { rows } = await pool.query<Card>(
    `SELECT * FROM card WHERE esid = $1`,
    [esid],
  )
  return rows[0] ?? null
}

/**
 * Returns the card whose date matches the playing-card logic in Card.ts.
 * Useful for the "card of the moment" feature.
 */
export async function getCardByDate(
  year: number,
  month: number,
  day: number,
  hour: number,
): Promise<Card[]> {
  const { rows } = await pool.query<Card>(
    `SELECT * FROM card
     WHERE year = $1 AND month = $2 AND day = $3 AND hour = $4`,
    [year, month, day, hour],
  )
  return rows
}

export async function getCardByStem(stem: string): Promise<Card | null> {
  const { rows } = await pool.query<Card>(
    `SELECT * FROM card WHERE stem = $1`,
    [stem],
  )
  return rows[0] ?? null
}

export async function getCardBySlug(slug: string): Promise<Card | null> {
  const { rows } = await pool.query<Card>(
    `SELECT * FROM card WHERE slug = $1`,
    [slug],
  )
  return rows[0] ?? null
}

export async function getCardBySuitAndRank(
  suit: string,
  rank: string,
): Promise<Card[]> {
  const { rows } = await pool.query<Card>(
    `SELECT * FROM card WHERE suit = $1 AND rank = $2 ORDER BY year, month, day, hour`,
    [suit, rank],
  )
  return rows
}

// ─── Watcher helpers ─────────────────────────────────────────────────────────

/** Returns a map of stem → file_mtime for all stored card. Fast O(1) lookups. */
export async function getAllStoredMtimes(): Promise<Map<string, number>> {
  const { rows } = await pool.query<{ stem: string; file_mtime: string }>(
    `SELECT stem, file_mtime FROM card`,
  )
  return new Map(rows.map((r) => [r.stem, Number(r.file_mtime)]))
}

// ─── Write ───────────────────────────────────────────────────────────────────

export interface UpsertCardInput {
  esid: string
  stem: string
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
}

export async function upsertCard(card: UpsertCardInput): Promise<void> {
  await pool.query(
    `INSERT INTO card
       (esid, stem, year, month, day, hour, artist, title, slug, suit, rank, url_audio, url_image, blurhash, file_mtime, file_size, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, now())
     ON CONFLICT (esid) DO UPDATE SET
       stem      = EXCLUDED.stem,
       artist    = EXCLUDED.artist,
       title     = EXCLUDED.title,
       slug      = EXCLUDED.slug,
       suit      = EXCLUDED.suit,
       rank      = EXCLUDED.rank,
       url_audio = EXCLUDED.url_audio,
       url_image = EXCLUDED.url_image,
       blurhash  = EXCLUDED.blurhash,
       file_mtime = EXCLUDED.file_mtime,
       file_size = EXCLUDED.file_size,
       updated_at = now()`,
    [
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
      card.url_audio,
      card.url_image,
      card.blurhash,
      card.file_mtime,
      card.file_size,
      card.created_at,
    ],
  )
}

export async function deleteCardByEsid(esid: string): Promise<void> {
  await pool.query(`DELETE FROM card WHERE esid = $1`, [esid])
}
