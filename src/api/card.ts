import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { Router, Request, Response } from 'express'
import {
  getAllCard,
  getCardById,
  getCardByEsid,
  getCardBySlug,
  getCardByDate,
  getCardBySuitAndRank,
  getClubsJacks,
  getCardCount,
  getCards,
  getFilteredCardCount,
  getLatestCards,
  upsertCard,
} from '../db/card'
import { scanCard } from '../scanner'
import { createEsid, slugify } from '../utils/slugify'
import { getCardFromDate } from '../utils/cardLogic'

const router = Router()
const MEDIA_DIR = process.env.MEDIA_DIR ?? '/var/cards'
const CARD_DIR = MEDIA_DIR
fs.mkdirSync(CARD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => cb(null, CARD_DIR),
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname)
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    cb(null, `${unique}${ext}`)
  },
})

const upload = multer({ storage })

const getUniqueFilename = (base: string, ext: string) => {
  let candidate = `${base}${ext}`
  let counter = 1
  while (fs.existsSync(path.join(CARD_DIR, candidate))) {
    candidate = `${base}-${counter}${ext}`
    counter += 1
  }
  return candidate
}

// ─── POST /api/card/upload ─────────────────────────────────────────────────────
router.post('/upload', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]), async (req: Request, res: Response) => {
  const {
    year,
    month,
    day,
    hour,
    artist,
    title,
    suit,
    rank,
    ext_audio,
    ext_image,
    created_at,
    file_mtime,
    file_size,
  } = req.body as Record<string, any>

  if (!year || !month || !day || !hour || !artist || !title || !suit || !rank) {
    res.status(400).json({ error: 'year, month, day, hour, artist, title, suit and rank are required' })
    return
  }

  const yearNum = Number(year)
  const monthNum = Number(month)
  const dayNum = Number(day)
  const hourNum = Number(hour)
  if ([yearNum, monthNum, dayNum, hourNum].some((val) => Number.isNaN(val))) {
    res.status(400).json({ error: 'year, month, day and hour must be numbers' })
    return
  }

  const createdAt = created_at ? new Date(created_at) : new Date()
  if (created_at && Number.isNaN(createdAt.getTime())) {
    res.status(400).json({ error: 'created_at must be a valid date string' })
    return
  }

  const files = (req as Request & { files?: Record<string, Express.Multer.File[]> }).files
  let audioPath = ext_audio?.trim() || ''
  let imagePath = ext_image?.trim() || ''
  let fileMtimeNum = file_mtime !== undefined ? Number(file_mtime) : 0
  let fileSizeNum = file_size !== undefined ? Number(file_size) : 0
  const slugBase = slugify(`${artist}__${title}`)
  const safeStem = [
    yearNum.toString().padStart(4, '0'),
    monthNum.toString().padStart(2, '0'),
    dayNum.toString().padStart(2, '0'),
    hourNum.toString().padStart(2, '0'),
  ].join('') + `__${artist.replaceAll(' ', '_').toLowerCase()}__${title.replaceAll(' ', '_').toLowerCase()}`

  if (files?.audio?.length) {
    const audioFile = files.audio[0]
    const ext = path.extname(audioFile.originalname)
    const filename = getUniqueFilename(safeStem, ext)
    const targetPath = path.join(CARD_DIR, filename)
    if (audioFile.path !== targetPath) fs.renameSync(audioFile.path, targetPath)
    audioPath = `files/${filename}`
    const stats = fs.statSync(targetPath)
    fileMtimeNum = Math.floor(stats.mtimeMs)
    fileSizeNum = stats.size
  }

  if (files?.image?.length) {
    const imageFile = files.image[0]
    const ext = path.extname(imageFile.originalname)
    const filename = getUniqueFilename(safeStem, ext)
    const targetPath = path.join(CARD_DIR, filename)
    if (imageFile.path !== targetPath) fs.renameSync(imageFile.path, targetPath)
    imagePath = `files/${filename}`
  }

  if (!audioPath) {
    res.status(400).json({ error: 'audio file or ext_audio is required' })
    return
  }

  const slug = slugBase

  res.status(201).json({
    ok: true,
    message: 'files received, scan will process DB',
    slug: slug,
  })
})

// ─── POST /apicard/rescan ─────────────────────────────────────────────────────
// Manually trigger a full re-scan (useful during development).
router.post('/rescan', async (_req: Request, res: Response) => {
  try {
    const result = await scanCard()
    res.json({ ok: true, ...result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Scan failed' })
  }
})

// ─── GET /api/card/random ─────────────────────────────────────────────────────────────
// Returns a random card.
router.get('/random', async (_req: Request, res: Response) => {
  try {
    const card = await getAllCard()
    const randomCard = card[Math.floor(Math.random() * card.length)]
    res.json(randomCard)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/card ─────────────────────────────────────────────────────────────
// Returns cards filtered by query parameters or paginated if no filters are provided.
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const offset = (page - 1) * limit
    const search = (req.query.search as string)?.trim()
    const suit = (req.query.suit as string)?.trim()
    const rank = (req.query.rank as string)?.trim()
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined

    if (page < 1) {
      res.status(400).json({ error: 'page must be >= 1' })
      return
    }
    if (limit < 1 || limit > 1000) {
      res.status(400).json({ error: 'limit must be between 1 and 1000' })
      return
    }

    const hasFilter = Boolean(search || suit || rank || year !== undefined)

    if (hasFilter) {
      const [cards, total] = await Promise.all([
        getCards({ search, suit, rank, year, limit, offset }),
        getFilteredCardCount({ search, suit, rank, year }),
      ])

      const totalPages = Math.ceil(total / limit)
      res.json({
        data: cards,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      })
      return
    }

    const [cards, total] = await Promise.all([
      getAllCard(limit, offset),
      getCardCount(),
    ])

    const totalPages = Math.ceil(total / limit)

    res.json({
      data: cards,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/card/latest?limit=10 ───────────────────────────────────────────────
router.get('/latest', async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10
  if (limit < 1 || limit > 1000) {
    res.status(400).json({ error: 'limit must be between 1 and 1000' })
    return
  }

  try {
    const cards = await getLatestCards(limit)
    res.json(cards)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const parseDateFromQuery = (query: Record<string, any>): Date => {
  if (query.timestamp) {
    const timestamp = Number(query.timestamp)
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp)
    }
  }

  if (query.date) {
    const parsed = new Date(query.date)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  const now = new Date()
  const year = query.year !== undefined ? Number(query.year) : now.getFullYear()
  const month = query.month !== undefined ? Number(query.month) : now.getMonth() + 1
  const day = query.day !== undefined ? Number(query.day) : now.getDate()
  const hour = query.hour !== undefined ? Number(query.hour) : now.getHours()

  if ([year, month, day, hour].some((value) => Number.isNaN(value))) {
    return now
  }

  return new Date(year, month - 1, day, hour)
}

// ─── GET /api/card/rank-suit?timestamp=...&date=...&year=...&month=...&day=...&hour=... ──
router.get('/rank-suit', async (req: Request, res: Response) => {
  try {
    const date = parseDateFromQuery(req.query as Record<string, any>)
    const { suit, rank } = getCardFromDate(date)
    res.json({ suit, rank, timestamp: date.getTime() })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/card/by-suit-rank?suit=♠&rank=A ──────────────────────────────────
router.get('/by-suit-rank', async (req: Request, res: Response) => {
  let { suit, rank } = req.query as { suit?: string; rank?: string }

  if (!suit || !rank) {
    const cardDate = getCardFromDate(new Date())
    suit = cardDate.suit
    rank = cardDate.rank
  }

  try {
    const card = await getCardBySuitAndRank(suit, rank)
    res.json(card)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/card/clubs-jacks ─────────────────────────────────────────────────────
// Returns all jacks of clubs.
router.get('/clubs-jacks', async (_req: Request, res: Response) => {
  try {
    const cards = await getClubsJacks()
    res.json(cards)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/card/by-date?year=2024&month=9&day=15&hour=22 ────────────────────
router.get('/by-date', async (req: Request, res: Response) => {
  const { year, month, day, hour } = req.query as Record<string, string>
  if (!year || !month || !day || !hour) {
    res.status(400).json({ error: 'year, month, day and hour are required' })
    return
  }
  try {
    const card = await getCardByDate(+year, +month, +day, +hour)
    res.json(card)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/card/esid/:esid ──────────────────────────────────────────────────
router.get('/esid/:esid', async (req: Request, res: Response) => {
  try {
    const card = await getCardByEsid(req.params.esid)
    if (!card) { res.status(404).json({ error: 'Not found' }); return }
    res.json(card)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/card/slug/:slug ───────────────────────────────────────────────────
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const card = await getCardBySlug(req.params.slug)
    if (!card) { res.status(404).json({ error: 'Not found' }); return }
    res.json(card)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/card/:id ─────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return }
  try {
    const card = await getCardById(id)
    if (!card) { res.status(404).json({ error: 'Not found' }); return }
    res.json(card)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
