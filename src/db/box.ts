import path from 'path'
import { pool } from './pool'
import type { Card } from '../types'

type BoxRow = {
  id: string
  name: string
  artists: Record<string, unknown>
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
  coverFront?: string | null
  coverBack?: string | null
}): Promise<void> {
  await pool.query(
    `INSERT INTO box (id, name, artists, cover_front, cover_back)
     VALUES ($1, $2, $3::jsonb, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       artists = EXCLUDED.artists,
       cover_front = EXCLUDED.cover_front,
       cover_back = EXCLUDED.cover_back,
       updated_at = now()`,
    [
      params.id,
      params.name,
      JSON.stringify(params.artists ?? {}),
      params.coverFront ?? null,
      params.coverBack ?? null,
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

  return rows.map((row) => ({ ...row, card_count: Number(row.card_count) }))
}

export async function getBoxById(boxId: string): Promise<BoxRow | null> {
  const { rows } = await pool.query<BoxRow>(`SELECT * FROM box WHERE id = $1`, [boxId])
  return rows[0] ?? null
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
