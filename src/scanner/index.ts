/**
 * Card scanner
 *
 * Scans CARDS_DIR, parses filenames, computes playing-card values,
 * then upserts into Postgres.  Only rows whose mtime has changed are updated.
 *
 * Can be run standalone:  ts-node src/scanner/index.ts
 * Or called programmatically from the watcher / on startup.
 */

import fs from 'fs'
import path from 'path'
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
  getCardByStem,
} from '../db/cards'

const CARD_DIR = process.env.CARDS_DIR ?? path.resolve(__dirname, '../../cards/normal')

interface FileEntry {
  stem: string
  ext:  string
  full: string
  mtime: number
}

/**
 * Groups files by their stem (filename without extension).
 * Returns a map: stem → { audio?, image? }
 */
function groupByEsid(dir: string): Map<string, { audio?: FileEntry; image?: FileEntry }> {
  const entries = fs.readdirSync(dir)
  const groups  = new Map<string, { audio?: FileEntry; image?: FileEntry }>()

  for (const filename of entries) {
    const full  = path.join(dir, filename)
    const stat  = fs.statSync(full)
    if (!stat.isFile()) continue

    const parsed = path.parse(filename)
    const stem   = parsed.name
    const ext    = parsed.ext.toLowerCase()
    const entry: FileEntry = { stem, ext, full, mtime: Math.floor(stat.mtimeMs) }

    if (!groups.has(stem)) groups.set(stem, {})
    const group = groups.get(stem)!

    if (isAudioFile(filename)) group.audio = entry
    else if (isImageFile(filename)) group.image = entry
  }

  return groups
}

export async function scanCards(): Promise<{ added: number; updated: number; removed: number }> {
  console.log(`🔍  Scanning ${CARD_DIR}`)

  const storedMtimes = await getAllStoredMtimes()
  const diskGroups   = groupByEsid(CARD_DIR)

  let added = 0, updated = 0, removed = 0

  // ── Collect all stems present on disk ───────────────────────────────────
  const diskStems = new Set(diskGroups.keys())

  // ── Upsert cards found on disk ────────────────────────────────────────────
  for (const [stem, { audio, image }] of diskGroups) {
    // A normal card MUST have an audio file — skip image-only entries
    if (!audio) continue

    const parsed = parseCardFilename(audio.stem + audio.ext)
    if (!parsed) {
      console.warn(`⚠️  Could not parse filename: ${audio.stem}${audio.ext}`)
      continue
    }

    const storedMtime = storedMtimes.get(stem)
    const isNew       = storedMtime === undefined
    const isChanged   = !isNew && storedMtime !== audio.mtime

    // Skip files that haven't changed
    if (!isNew && !isChanged) {
      storedMtimes.delete(stem)   // mark as still present
      continue
    }

    const date = new Date(parsed.year, parsed.month - 1, parsed.day, parsed.hour)
    const { suit, rank } = getCardFromDate(date)

    // Generate unique esid and slug
    const esid = createEsid(parsed.year, parsed.month, parsed.day, parsed.hour, parsed.artist, parsed.title)
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
    let blurhash: string | undefined
    if (image) {
      const generated = await generateBlurhash(image.full)
      blurhash = generated || undefined
    }

    // Build paths relative to CARD_DIR so the frontend can resolve them
    const relativePath = (entry: FileEntry) =>
      path.relative(CARD_DIR, entry.full)

    await upsertCard({
      esid,
      stem: audio.stem,  // Add the stem here
      year: parsed.year,
      month: parsed.month,
      day: parsed.day,
      hour: parsed.hour,
      artist: parsed.artist,
      title: parsed.title,
      slug,
      suit,
      rank,
      url_audio: relativePath(audio),
      url_image: image ? relativePath(image) : '',
      blurhash,
      file_mtime: audio.mtime,
      created_at: date,
    })

    storedMtimes.delete(stem)   // mark as still present

    if (isNew) { added++;   console.log(`  ➕ ${stem}`) }
    else        { updated++; console.log(`  ✏️  ${stem}`) }
  }

  // ── Remove cards no longer on disk ────────────────────────────────────────
  for (const [stem] of storedMtimes) {
    // Only remove if stem is truly not on disk
    if (!diskStems.has(stem)) {
      // Get the esid for this stem to delete properly
      const card = await getCardByStem(stem)
      if (card) {
        await deleteCardByEsid(card.esid)
        removed++
        console.log(`  ➖ ${stem}`)
      }
    }
  }

  console.log(`✅  Scan complete — added: ${added}, updated: ${updated}, removed: ${removed}`)
  return { added, updated, removed }
}

// ── Standalone entry point ────────────────────────────────────────────────────
if (require.main === module) {
  const { pool } = require('../db/pool')
  scanCards()
    .then(({ added, updated, removed }) => {
      console.log({ added, updated, removed })
    })
    .catch(console.error)
    .finally(() => pool.end())
}
