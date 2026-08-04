import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

import { parseCardFilename, isAudioFile, isImageFile } from '../utils/parseFilename'
import { getCardFromDate } from '../utils/cardLogic'
import { createEsid, slugify } from '../utils/slugify'
import { generateBlurhash } from '../utils/blurhash'
import {
  getAllStoredMtimes,
  upsertCard,
  deleteCardByEsid,
  getCardBySlug,
} from '../db/card'
import { removeMissingBoxes, replaceBoxCards, upsertBox } from '../db/box'

const MEDIA_DIR = process.env.MEDIA_DIR ?? '/var/cards'
const CARD_DIR = MEDIA_DIR

interface FileEntry {
  relStem: string
  boxId: string | null
  side: 'A' | 'B' | null
  stem: string
  ext:  string
  full: string
  mtime: number
  size: number
}

interface BoxMeta {
  id: string
  name: string
  artists: Record<string, unknown>
  color: Record<string, string>
  quote: Record<string, Record<string, string | QuoteArtistRef>>
  coverFront: string | null
  coverBack: string | null
  tracklist: Array<{ id: string; position: number; side: 'A' | 'B' | null }>
}

type QuoteArtistRef = {
  name: string
  url?: string
}

interface GroupEntry {
  audio?: FileEntry
  image?: FileEntry
}

function hash(input: string): string {
  return createHash('md5').update(input).digest('hex')
}

function normalizeArtistRef(value: unknown): QuoteArtistRef | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  if (!name) {
    return null
  }

  const url = typeof record.url === 'string' && record.url.trim().length > 0
    ? record.url.trim()
    : undefined

  return url ? { name, url } : { name }
}

function normalizeQuoteEntry(key: string, value: unknown): [string, string | QuoteArtistRef] | null {
  if ((key === 'author' || key === 'auhor')) {
    const artistRef = normalizeArtistRef(value)
    if (artistRef) {
      return [key, artistRef]
    }
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [key, value.trim()]
  }

  if ((key === 'author' || key === 'auhor') && typeof value === 'number' && Number.isFinite(value)) {
    return [key, String(value)]
  }

  return null
}

function findTrackIdByPosition(
  sideKey: string,
  position: number,
  tracklist: Array<{ id: string; position: number; side: 'A' | 'B' | null }>,
): string | null {
  const normalizedSide = sideKey.toUpperCase()

  const exactSide = tracklist.find((entry) => entry.position === position && entry.side === normalizedSide)
  if (exactSide) {
    return exactSide.id
  }

  const noSide = tracklist.find((entry) => entry.position === position && entry.side === null)
  if (noSide) {
    return noSide.id
  }

  const anySide = tracklist.find((entry) => entry.position === position)
  return anySide?.id ?? null
}

function resolveQuoteArtistRef(
  sideKey: string,
  rawValue: string,
  tracklist: Array<{ id: string; position: number; side: 'A' | 'B' | null }>,
  artists: Record<string, unknown>,
): QuoteArtistRef | null {
  const normalizedValue = rawValue.trim()
  if (!normalizedValue) {
    return null
  }

  const position = Number.parseInt(normalizedValue, 10)
  if (Number.isFinite(position)) {
    const trackId = findTrackIdByPosition(sideKey, position, tracklist)
    if (trackId) {
      const artistByPosition = normalizeArtistRef(artists[trackId])
      if (artistByPosition) {
        return artistByPosition
      }
    }
  }

  return normalizeArtistRef(artists[normalizedValue])
}

function enrichQuoteAuthors(
  quote: Record<string, Record<string, string | QuoteArtistRef>>,
  tracklist: Array<{ id: string; position: number; side: 'A' | 'B' | null }>,
  artists: Record<string, unknown>,
): Record<string, Record<string, string | QuoteArtistRef>> {
  for (const [sideKey, sideQuote] of Object.entries(quote)) {
    for (const key of ['author', 'auhor']) {
      const currentValue = sideQuote[key]
      if (typeof currentValue !== 'string') {
        continue
      }

      const resolved = resolveQuoteArtistRef(sideKey, currentValue, tracklist, artists)
      if (resolved) {
        sideQuote[key] = resolved
      }
    }
  }

  return quote
}

function getEntry(dir: string, filename: string, boxId: string | null, side: 'A' | 'B' | null): FileEntry {
  const full = path.join(dir, filename)
  const stat = fs.statSync(full)
  const parsed = path.parse(filename)
  const relStem = boxId ? `${boxId}/${parsed.name}` : parsed.name

  return {
    relStem,
    boxId,
    side,
    stem: parsed.name,
    ext: parsed.ext.toLowerCase(),
    full,
    mtime: Math.floor(stat.mtimeMs),
    size: stat.size,
  }
}

function parseBoxMeta(dir: string, boxId: string): BoxMeta {
  const indexPath = fs.existsSync(path.join(dir, 'index.json'))
    ? path.join(dir, 'index.json')
    : path.join(dir, '0.index.json')
  let name = boxId
  let artists: Record<string, unknown> = {}
  let color: Record<string, string> = {}
  let quote: Record<string, Record<string, string | QuoteArtistRef>> = {}
  const tracklist: Array<{ id: string; position: number; side: 'A' | 'B' | null }> = []

  if (fs.existsSync(indexPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
        name?: string
        artists?: Record<string, unknown>
        color?: Record<string, unknown>
        quote?: Record<string, unknown>
        tracklist?: Record<string, unknown>
      }
      if (typeof parsed.name === 'string' && parsed.name.trim()) {
        name = parsed.name.trim()
      }
      if (parsed.artists && typeof parsed.artists === 'object') {
        artists = parsed.artists
      }
      if (parsed.color && typeof parsed.color === 'object') {
        color = Object.fromEntries(
          Object.entries(parsed.color)
            .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0)
            .map(([side, value]) => [side.toUpperCase(), value.trim()]),
        )
      }
      if (parsed.quote && typeof parsed.quote === 'object') {
        quote = Object.fromEntries(
          Object.entries(parsed.quote)
            .filter((entry): entry is [string, Record<string, unknown>] => Boolean(entry[1]) && typeof entry[1] === 'object')
            .map(([side, value]) => [
              side.toUpperCase(),
              Object.fromEntries(
                Object.entries(value)
                  .map(([key, quoteValue]) => normalizeQuoteEntry(key, quoteValue))
                  .filter((quoteEntry): quoteEntry is [string, string | QuoteArtistRef] => Boolean(quoteEntry)),
              ),
            ]),
        )
      }

      if (parsed.tracklist && typeof parsed.tracklist === 'object') {
        const tracklistObject = parsed.tracklist as Record<string, unknown>
        const hasSides = typeof tracklistObject.A === 'object' || typeof tracklistObject.B === 'object'

        if (hasSides) {
          const sides: Array<'A' | 'B'> = ['A', 'B']
          for (const side of sides) {
            const sideEntries = tracklistObject[side]
            if (!sideEntries || typeof sideEntries !== 'object') continue

            const ordered = Object.entries(sideEntries as Record<string, unknown>)
              .map(([key, value]) => {
                const record = (value && typeof value === 'object') ? value as Record<string, unknown> : {}
                return {
                  position: Number.parseInt(key, 10),
                  id: typeof record.id === 'string' ? record.id.trim() : '',
                  artist: record.artist,
                  side,
                }
              })
              .filter((entry) => Number.isFinite(entry.position) && entry.id.length > 0)
              .sort((a, b) => a.position - b.position)

            for (const entry of ordered) {
              tracklist.push({ id: entry.id, position: entry.position, side: entry.side })
              if (!artists[entry.id] && entry.artist && typeof entry.artist === 'object') {
                artists[entry.id] = entry.artist as Record<string, unknown>
              }
            }
          }
        } else {
          const ordered = Object.entries(tracklistObject)
            .map(([key, value]) => {
              const record = (value && typeof value === 'object') ? value as Record<string, unknown> : {}
              return {
                position: Number.parseInt(key, 10),
                id: typeof record.id === 'string' ? record.id.trim() : '',
                artist: record.artist,
              }
            })
            .filter((entry) => Number.isFinite(entry.position) && entry.id.length > 0)
            .sort((a, b) => a.position - b.position)

          for (const entry of ordered) {
            tracklist.push({ id: entry.id, position: entry.position, side: null })
            if (!artists[entry.id] && entry.artist && typeof entry.artist === 'object') {
              artists[entry.id] = entry.artist as Record<string, unknown>
            }
          }
        }
      }

      quote = enrichQuoteAuthors(quote, tracklist, artists)
    } catch (error) {
      console.warn(`⚠️  Failed parsing box index: ${indexPath}`, error)
    }
  }

  const findFirstExisting = (filenames: string[]): string | null => {
    for (const filename of filenames) {
      if (fs.existsSync(path.join(dir, filename))) {
        return filename
      }
    }
    return null
  }

  const frontFilename = findFirstExisting([
    'front-a.jpg',
    'front-a.jpeg',
    'front.jpg',
    'front.jpeg',
    '0.front.jpg',
    '0.front.jpeg',
  ])
  const backFilename = findFirstExisting([
    'back-a.jpg',
    'back-a.jpeg',
    'back.jpg',
    'back.jpeg',
    '0.back.jpg',
    '0.back.jpeg',
  ])

  const coverFront = frontFilename ? path.posix.join('files', boxId, frontFilename) : null
  const coverBack = backFilename ? path.posix.join('files', boxId, backFilename) : null

  return { id: boxId, name, artists, color, quote, coverFront, coverBack, tracklist }
}

function discoverDisk(root: string): { groups: Map<string, GroupEntry>; boxes: Map<string, BoxMeta> } {
  const groups = new Map<string, GroupEntry>()
  const boxes = new Map<string, BoxMeta>()
  const entries = fs.readdirSync(root, { withFileTypes: true })

  const pushEntry = (entry: FileEntry, filename: string) => {
    if (!groups.has(entry.relStem)) groups.set(entry.relStem, {})
    const group = groups.get(entry.relStem)!

    if (isAudioFile(filename)) group.audio = entry
    else if (isImageFile(filename)) group.image = entry
  }

  for (const entry of entries) {
    if (entry.isFile()) {
      const filename = entry.name
      if (!isAudioFile(filename) && !isImageFile(filename)) continue

      const diskEntry = getEntry(root, filename, null, null)
      pushEntry(diskEntry, filename)
      continue
    }

    if (!entry.isDirectory()) continue

    const boxId = entry.name
    const boxDir = path.join(root, boxId)
    const sideMatch = boxId.match(/[AB]$/i)
    const side = (sideMatch ? sideMatch[0].toUpperCase() : null) as 'A' | 'B' | null

    boxes.set(boxId, parseBoxMeta(boxDir, boxId))

    const boxFiles = fs.readdirSync(boxDir, { withFileTypes: true })
    for (const file of boxFiles) {
      if (!file.isFile()) continue
      if (
        file.name === 'index.json'
        || file.name === '0.index.json'
        || file.name === 'front-a.jpg'
        || file.name === 'front-a.jpeg'
        || file.name === 'back-a.jpg'
        || file.name === 'back-a.jpeg'
        || file.name === 'front-b.jpg'
        || file.name === 'front-b.jpeg'
        || file.name === 'back-b.jpg'
        || file.name === 'back-b.jpeg'
        || file.name === 'front.jpg'
        || file.name === 'front.jpeg'
        || file.name === 'back.jpg'
        || file.name === 'back.jpeg'
        || file.name === '0.front.jpg'
        || file.name === '0.front.jpeg'
        || file.name === '0.back.jpg'
        || file.name === '0.back.jpeg'
      ) continue
      if (!isAudioFile(file.name) && !isImageFile(file.name)) continue

      const diskEntry = getEntry(boxDir, file.name, boxId, side)
      pushEntry(diskEntry, file.name)
    }
  }

  return { groups, boxes }
}

export async function scanCard(): Promise<{ added: number; updated: number; removed: number }> {
  console.log(`🔍  Scanning ${CARD_DIR}`)

  const storedMtimes = await getAllStoredMtimes()
  const { groups: diskGroups, boxes } = discoverDisk(CARD_DIR)

  let added = 0, updated = 0, removed = 0
  const diskEsids = new Set<string>()
  const rootStemToEsid = new Map<string, string>()
  const boxCardMap = new Map<string, Array<{ cardEsid: string; position: number; side: 'A' | 'B' | null }>>()

  // ── Upsert card found on disk ────────────────────────────────────────────
  for (const [, { audio, image }] of diskGroups) {
    // A normal card MUST have an audio file — skip image-only entries
    if (!audio) continue

    // Only scan canonical cards named like YYYYMMDDHH__artist__title.ext
    if (!/^\d{10}__/.test(audio.stem)) continue

    const parsed = parseCardFilename(audio.stem + audio.ext)
    if (!parsed) continue

    const esid = audio.boxId ? hash(`${audio.boxId}:${audio.relStem}`) : createEsid(parsed.year, parsed.month, parsed.day, parsed.hour, parsed.artist, parsed.title)
    diskEsids.add(esid)

    if (!audio.boxId) {
      rootStemToEsid.set(audio.stem, esid)
    }

    if (audio.boxId) {
      if (!boxCardMap.has(audio.boxId)) boxCardMap.set(audio.boxId, [])
      boxCardMap.get(audio.boxId)!.push({
        cardEsid: esid,
        position: parsed.month,
        side: audio.side,
      })
    }

    const storedMtime = storedMtimes.get(esid)
    const isNew       = storedMtime === undefined
    const isChanged   = !isNew && storedMtime !== audio.mtime

    // Skip files that haven't changed
    if (!isNew && !isChanged) {
      storedMtimes.delete(esid)   // mark as still present
      continue
    }

    const date = new Date(parsed.year, parsed.month - 1, parsed.day, parsed.hour)
    const { suit, rank } = getCardFromDate(date)

    let slug = slugify(`${parsed.artist} ${parsed.title}`)

    // Handle potential slug conflicts by checking if it exists
    let slugSuffix = 1
    let originalSlug = slug
    while (true) {
      try {
        // Try to find if this slug already exists
        const existingCard = await getCardBySlug(slug)
        if (!existingCard || existingCard.esid === esid) {
          break // Slug is available or belongs to this card
        }
        slug = `${originalSlug}-${slugSuffix}`
        slugSuffix++
      } catch (error) {
        // If there's an error checking the slug, assume it's available
        break
      }
    }

    // Generate blurhash if image exists
    let blurhash: string | null = null
    if (image) {
      const generated = await generateBlurhash(image.full)
      blurhash = generated || null
    }

    const getFileExtension = (filePath: string): string => {
      return path.extname(filePath).slice(1).toLowerCase()
    }

    await upsertCard({
      esid,
      stem: audio.relStem,
      year: parsed.year,
      month: parsed.month,
      day: parsed.day,
      hour: parsed.hour,
      artist: parsed.artist,
      title: parsed.title,
      slug,
      suit,
      rank,
      ext_audio: getFileExtension(audio.full),
      ext_image: image ? getFileExtension(image.full) : '',
      blurhash,
      file_mtime: audio.mtime,
      file_size: audio.size,
      created_at: date,
    })

    storedMtimes.delete(esid)   // mark as still present

    if (isNew) { added++;   console.log(`  ➕ ${audio.relStem}`) }
    else        { updated++; console.log(`  ✏️  ${audio.relStem}`) }
  }

  // ── Remove card no longer on disk ────────────────────────────────────────
  for (const [esid] of storedMtimes) {
    if (diskEsids.has(esid)) continue
    await deleteCardByEsid(esid)
    removed++
    console.log(`  ➖ ${esid}`)
  }

  const validBoxIds = Array.from(boxes.keys())
  for (const boxId of validBoxIds) {
    const meta = boxes.get(boxId)!

    const cardsFromTracklist = meta.tracklist
      .map(({ id, position, side }) => {
        const mappedEsid = rootStemToEsid.get(id)
        if (!mappedEsid) {
          console.warn(`⚠️  Box ${boxId}: tracklist card not found on disk: ${id}`)
          return null
        }

        return {
          cardEsid: mappedEsid,
          position,
          side,
        }
      })
      .filter((entry): entry is { cardEsid: string; position: number; side: 'A' | 'B' | null } => entry !== null)

    const legacyCards = boxCardMap.get(boxId) ?? []
    const cards = (cardsFromTracklist.length > 0 ? cardsFromTracklist : legacyCards).sort((a, b) => {
      if (a.side !== b.side) return (a.side ?? '').localeCompare(b.side ?? '')
      return a.position - b.position
    })

    await upsertBox(meta)
    await replaceBoxCards(boxId, cards)
  }

  await removeMissingBoxes(validBoxIds)

  console.log(`✅  Scan complete — added: ${added}, updated: ${updated}, removed: ${removed}`)
  return { added, updated, removed }
}

// ── Standalone entry point ────────────────────────────────────────────────────
if (require.main === module) {
  const { pool } = require('../db/pool')
  scanCard()
    .then(({ added, updated, removed }) => {
      console.log({ added, updated, removed })
    })
    .catch(console.error)
    .finally(() => pool.end())
}
