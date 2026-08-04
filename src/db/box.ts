import path from 'path'
import { pool } from './pool'
import type { Card } from '../types'

type BoxRow = {
  id: string
  name: string
  artists: Record<string, unknown>
  color: Record<string, string>
  quote: Record<string, unknown>
  cover_front: string | null
  cover_back: string | null
  created_at: Date
  updated_at: Date
}

type BoxCardEntry = {
  cardEsid: string
  position: number
  side: 'A' | 'B' | null
}

function normalizeBoxMediaPath(value: string | null | undefined): string | null {
  const media = (value ?? '').trim()
  if (!media) return null
  if (media.startsWith('files/')) return media

  return path.posix.join('files', media)
}

function withMediaUrls<T extends Card>(card: T): T & { url_audio: string; url_image?: string } {
  const url_audio = path.posix.join('files', `${card.stem}.${card.ext_audio}`)
  const payload: T & { url_audio: string; url_image?: string } = {
    ...card,
    url_audio,
  }
  if (card.ext_image) {
    payload.url_image = path.posix.join('files', `${card.stem}.${card.ext_image}`)
  }
  return payload
}

export async function upsertBox(params: {
  id: string
  name: string
  artists: Record<string, unknown>
  color?: Record<string, string>
  quote?: Record<string, unknown>
  coverFront?: string | null
  coverBack?: string | null
}): Promise<void> {
  await pool.query(
    `INSERT INTO box (id, name, artists, color, quote, cover_front, cover_back)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       artists = EXCLUDED.artists,
       color = EXCLUDED.color,
       quote = EXCLUDED.quote,
       cover_front = EXCLUDED.cover_front,
       cover_back = EXCLUDED.cover_back,
       updated_at = now()`,
    [
      params.id,
      params.name,
      JSON.stringify(params.artists ?? {}),
      JSON.stringify(params.color ?? {}),
      JSON.stringify(params.quote ?? {}),
      normalizeBoxMediaPath(params.coverFront),
      normalizeBoxMediaPath(params.coverBack),
    ],
  )
}

export async function replaceBoxCards(boxId: string, entries: BoxCardEntry[]): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DELETE FROM box_card WHERE box_id = $1`, [boxId])

    for (const entry of entries) {
      await client.query(
        `INSERT INTO box_card (box_id, card_esid, position, side)
         VALUES ($1, $2, $3, $4)`,
        [boxId, entry.cardEsid, entry.position, entry.side],
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function removeMissingBoxes(validBoxIds: string[]): Promise<void> {
  if (validBoxIds.length === 0) {
    await pool.query(`DELETE FROM box`)
    return
  }

  await pool.query(`DELETE FROM box WHERE NOT (id = ANY($1::text[]))`, [validBoxIds])
}

export async function getAllBoxes(): Promise<Array<BoxRow & { card_count: number }>> {
  const { rows } = await pool.query<BoxRow & { card_count: string }>(
    `SELECT b.*, COUNT(bc.card_esid)::text AS card_count
     FROM box b
     LEFT JOIN box_card bc ON bc.box_id = b.id
     GROUP BY b.id
     ORDER BY b.id`,
  )

  return rows.map((row) => ({
    ...row,
    color: row.color ?? {},
    quote: row.quote ?? {},
    cover_front: normalizeBoxMediaPath(row.cover_front),
    cover_back: normalizeBoxMediaPath(row.cover_back),
    card_count: Number(row.card_count),
  }))
}

export async function getBoxById(boxId: string): Promise<BoxRow | null> {
  const { rows } = await pool.query<BoxRow>(`SELECT * FROM box WHERE id = $1`, [boxId])
  const row = rows[0]
  if (!row) return null

  return {
    ...row,
    color: row.color ?? {},
    quote: row.quote ?? {},
    cover_front: normalizeBoxMediaPath(row.cover_front),
    cover_back: normalizeBoxMediaPath(row.cover_back),
  }
}

export async function getCardsByBoxId(boxId: string): Promise<Array<Card & { url_audio: string; url_image?: string; box_position: number; box_side: string | null }>> {
  const { rows } = await pool.query<Card & { box_position: number; box_side: string | null }>(
    `SELECT c.*, bc.position AS box_position, bc.side AS box_side
     FROM box_card bc
     JOIN card c ON c.esid = bc.card_esid
     WHERE bc.box_id = $1
     ORDER BY bc.side NULLS LAST, bc.position`,
    [boxId],
  )

  return rows.map((row) => withMediaUrls(row))
}
