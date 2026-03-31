import { createHash } from 'crypto'
import { pool } from './pool'
import type { Tarot } from '../types'
import { tape as tapes, artists, cards as tarots } from './tarotData'

type Tape = {
  id: string
  duration: number
  sides: {
    A: { duration: number }
    B: { duration: number }
  }
}

type Artist = {
  id: number
  name: string
  url?: string
  coverUrl?: string
}

type TarotInput = {
  order: number
  tapeId: string
  side: 'A' | 'B'
  title: string
  artist: number
  start: number
  link?: string
  coverUrl?: string
}

function buildTarotEsid(tapeId: string, side: string, order: number): string {
  return createHash('md5').update(`${tapeId}:${side}:${order}`).digest('hex')
}

function buildCoverUrl(value?: string): string | null {
  if (typeof value !== 'string') return null
  if (/^(https?:\/\/|\/\/)/i.test(value)) return value
  if (/^[a-zA-Z]?\d+$/.test(value)) {
    return `https://f4.bcbits.com/img/${value}_10.jpg`
  }
  return null
}

export async function importTarots(): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    for (const tape of tapes as Tape[]) {
      await client.query(
        `INSERT INTO tapes (id, duration) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET duration = EXCLUDED.duration, updated_at = now()`,
        [tape.id, tape.duration],
      )

      for (const side of ['A', 'B'] as const) {
        await client.query(
          `INSERT INTO sides (tape_id, side, duration)
           VALUES ($1, $2, $3)
           ON CONFLICT (tape_id, side) DO UPDATE SET duration = EXCLUDED.duration, updated_at = now()`,
          [tape.id, side, tape.sides[side].duration],
        )
      }
    }

    for (const artist of artists as Artist[]) {
      const coverUrl = buildCoverUrl(artist.coverUrl)

      await client.query(
        `INSERT INTO artists (id, name, url, cover_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           url = EXCLUDED.url,
           cover_url = EXCLUDED.cover_url,
           updated_at = now()`,
        [artist.id, artist.name, artist.url ?? null, coverUrl],
      )
    }

    for (const card of tarots as TarotInput[]) {
      const esid = buildTarotEsid(card.tapeId, card.side, card.order)
      const urlImage = buildCoverUrl(card.coverUrl)
      const urlAudio = `https://data.evilspins.com/files/tarots/${card.tapeId}/${card.side}.mp3`
      const urlTarot = `https://data.evilspins.com/files/tarots/${card.order}.jpg`

      await client.query(
        `INSERT INTO tarots
           (esid, tape_id, side, track_order, title, artist_id, start, link, url_audio, url_image, url_tarot)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (esid) DO UPDATE SET
           tape_id = EXCLUDED.tape_id,
           side = EXCLUDED.side,
           track_order = EXCLUDED.track_order,
           title = EXCLUDED.title,
           artist_id = EXCLUDED.artist_id,
           start = EXCLUDED.start,
           link = EXCLUDED.link,
           url_audio = EXCLUDED.url_audio,
           url_image = EXCLUDED.url_image,
           url_tarot = EXCLUDED.url_tarot,
           updated_at = now()`,
        [
          esid,
          card.tapeId,
          card.side,
          card.order,
          card.title,
          card.artist,
          card.start,
          card.link ?? null,
          urlAudio,
          urlImage,
          urlTarot,
        ],
      )
    }

    await client.query('COMMIT')
    console.log(`✅ Tarot dataset imported: ${tarots.length} cards, ${artists.length} artists, ${tapes.length} tapes`)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Tarot import failed:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function getAllTarots(): Promise<Tarot[]> {
  const { rows } = await pool.query<Tarot>(`SELECT * FROM tarots ORDER BY tape_id, side, track_order`)
  return rows
}

export async function getTarotById(id: number): Promise<Tarot | null> {
  const { rows } = await pool.query<Tarot>(`SELECT * FROM tarots WHERE id = $1`, [id])
  return rows[0] ?? null
}

export async function getTarotByEsid(esid: string): Promise<Tarot | null> {
  const { rows } = await pool.query<Tarot>(`SELECT * FROM tarots WHERE esid = $1`, [esid])
  return rows[0] ?? null
}

export async function getTarotsByTapeSide(tapeId: string, side: string): Promise<Tarot[]> {
  const { rows } = await pool.query<Tarot>(
    `SELECT * FROM tarots WHERE tape_id = $1 AND side = $2 ORDER BY track_order`,
    [tapeId, side],
  )
  return rows
}

export async function getTarotsByArtistId(artistId: number): Promise<Tarot[]> {
  const { rows } = await pool.query<Tarot>(
    `SELECT * FROM tarots WHERE artist_id = $1 ORDER BY tape_id, side, track_order`,
    [artistId],
  )
  return rows
}

if (require.main === module) {
  importTarots()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
