import { createHash } from 'crypto'
import { pool } from './pool'
import type { Tarot, TarotWithArtist } from '../types'
import { tape, artist, card as tarot } from './tarotData'

const tarotSelectWithArtist = `
  SELECT tarot.*, artist.name AS artist
  FROM tarot
  JOIN artist ON tarot.artist_id = artist.id
`

type Tape = {
  id: string
  duration: number
  side: {
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
  rank: number
  tapeId: string
  side: 'A' | 'B'
  title: string
  artist: number
  start: number
  link?: string
  coverUrl?: string
}

function buildTarotEsid(tapeId: string, side: string, rank: number): string {
  return createHash('md5').update(`${tapeId}:${side}:${rank}`).digest('hex')
}

function buildCoverUrl(value?: string): string | null {
  if (typeof value !== 'string') return null
  if (/^(https?:\/\/|\/\/)/i.test(value)) return value
  if (/^[a-zA-Z]?\d+$/.test(value)) {
    return `https://f4.bcbits.com/img/${value}_10.jpg`
  }
  return null
}

export async function importTarot(): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    for (const tapeItem of tape as Tape[]) {
      await client.query(
        `INSERT INTO tape (id, duration) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET duration = EXCLUDED.duration, updated_at = now()`,
        [tapeItem.id, tapeItem.duration],
      )

      for (const side of ['A', 'B'] as const) {
        await client.query(
          `INSERT INTO side (tape_id, side, duration)
           VALUES ($1, $2, $3)
           ON CONFLICT (tape_id, side) DO UPDATE SET duration = EXCLUDED.duration, updated_at = now()`,
          [tapeItem.id, side, tapeItem.side[side].duration],
        )
      }
    }

    for (const artistItem of artist as Artist[]) {
      const coverUrl = buildCoverUrl(artistItem.coverUrl)

      await client.query(
        `INSERT INTO artist (id, name, url, cover_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           url = EXCLUDED.url,
           cover_url = EXCLUDED.cover_url,
           updated_at = now()`,
        [artistItem.id, artistItem.name, artistItem.url ?? null, coverUrl],
      )
    }

    for (const card of tarot as TarotInput[]) {
      const esid = buildTarotEsid(card.tapeId, card.side, card.rank)
      const urlImage = buildCoverUrl(card.coverUrl)
      const urlAudio = `https://data.evilspins.com/files/tarot/${card.tapeId}${card.side}.mp3`
      const suit = (card.side === 'A' ? 0 : 11) + (card.rank - 1)

      await client.query(
        `INSERT INTO tarot
           (esid, tape_id, side, suit, rank, title, artist_id, start, link, url_audio, url_image)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (esid) DO UPDATE SET
           tape_id = EXCLUDED.tape_id,
           side = EXCLUDED.side,
           suit = EXCLUDED.suit,
           rank = EXCLUDED.rank,
           title = EXCLUDED.title,
           artist_id = EXCLUDED.artist_id,
           start = EXCLUDED.start,
           link = EXCLUDED.link,
           url_audio = EXCLUDED.url_audio,
           url_image = EXCLUDED.url_image,
           updated_at = now()`,
        [
          esid,
          card.tapeId,
          card.side,
          suit,
          card.rank,
          card.title,
          card.artist,
          card.start,
          card.link ?? null,
          urlAudio,
          urlImage,
        ],
      )
    }

    await client.query('COMMIT')
    console.log(`✅ Tarot dataset imported: ${tarot.length} card, ${artist.length} artist, ${tape.length} tape`)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Tarot import failed:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function getAllTarot(): Promise<TarotWithArtist[]> {
  const { rows } = await pool.query<TarotWithArtist>(`${tarotSelectWithArtist} ORDER BY tape_id, side, rank`)
  return rows
}

export async function getAllTape(): Promise<{ id: string; duration: number; created_at: Date; updated_at: Date }[]> {
  const { rows } = await pool.query<{ id: string; duration: number; created_at: Date; updated_at: Date }>(
    `SELECT id, duration, created_at, updated_at FROM tape ORDER BY id`,
  )
  return rows
}

export async function getRandomTarot(): Promise<TarotWithArtist | null> {
  const { rows } = await pool.query<TarotWithArtist>(`${tarotSelectWithArtist} ORDER BY RANDOM() LIMIT 1`)
  return rows[0] ?? null
}

export async function getTarotById(id: number): Promise<TarotWithArtist | null> {
  const { rows } = await pool.query<TarotWithArtist>(`${tarotSelectWithArtist} WHERE tarot.id = $1`, [id])
  return rows[0] ?? null
}

export async function getTarotByEsid(esid: string): Promise<TarotWithArtist | null> {
  const { rows } = await pool.query<TarotWithArtist>(`${tarotSelectWithArtist} WHERE tarot.esid = $1`, [esid])
  return rows[0] ?? null
}

export async function getTarotByTapeSide(tapeId: string, side: string): Promise<TarotWithArtist[]> {
  const { rows } = await pool.query<TarotWithArtist>(
    `${tarotSelectWithArtist} WHERE tarot.tape_id = $1 AND tarot.side = $2 ORDER BY tarot.rank`,
    [tapeId, side],
  )
  return rows
}

export async function getTarotByArtistId(artistId: number): Promise<TarotWithArtist[]> {
  const { rows } = await pool.query<TarotWithArtist>(
    `${tarotSelectWithArtist} WHERE tarot.artist_id = $1 ORDER BY tarot.tape_id, tarot.side, tarot.rank`,
    [artistId],
  )
  return rows
}

if (require.main === module) {
  importTarot()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
