import path from 'path'

const AUDIO_EXTS = new Set(['.mp3', '.flac', '.opus', '.ogg', '.wav', '.aac'])
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export interface ParsedFilename {
  esid: string        // stem without extension, e.g. "2004011815__connie_francis__siboney"
  year: number
  month: number
  day: number
  hour: number
  artist: string      // human-readable, underscores replaced by spaces
  title: string
}

/**
 * Parses a card filename.
 *
 * Format: YYYYMMDDHH__artist_name__track_title.ext
 *         └── 10 chars ─┘└─ slug ─┘└─── slug ───┘
 *
 * Returns null when the filename does not match the expected pattern.
 */
export function parseCardFilename(filename: string): ParsedFilename | null {
  const stem = path.parse(filename).name          // drop extension
  const parts = stem.split('__')

  // We need at least 3 parts: datecode, artist, title
  // (title itself might contain __ so we join tail parts)
  if (parts.length < 3) return null

  const [datePart, artistSlug, ...titleParts] = parts
  const title = titleParts.join('__')

  // Validate datecode: exactly 10 numeric digits
  if (!/^\d{10}$/.test(datePart)) return null

  const year  = parseInt(datePart.slice(0, 4), 10)
  const month = parseInt(datePart.slice(4, 6), 10)
  const day   = parseInt(datePart.slice(6, 8), 10)
  const hour  = parseInt(datePart.slice(8, 10), 10)

  if (month < 1 || month > 12) return null
  if (day   < 1 || day   > 31) return null
  if (hour  < 0 || hour  > 23) return null

  const humanize = (slug: string) =>
    slug.replace(/_/g, ' ').trim()

  return {
    esid:   stem,
    year,
    month,
    day,
    hour,
    artist: humanize(artistSlug),
    title:  humanize(title),
  }
}

export function isAudioFile(filename: string): boolean {
  return AUDIO_EXTS.has(path.extname(filename).toLowerCase())
}

export function isImageFile(filename: string): boolean {
  return IMAGE_EXTS.has(path.extname(filename).toLowerCase())
}
