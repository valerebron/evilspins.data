import { Router, Request, Response } from 'express'
import {
  getAllCard,
  getCardById,
  getCardByEsid,
  getCardBySlug,
  getCardByDate,
  getCardBySuitAndRank,
  getClubsJacks,
} from '../db/card'
import { scanCard } from '../scanner'

const router = Router()

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
// Returns all card, ordered by date added.
router.get('/', async (_req: Request, res: Response) => {
  try {
    const card = await getAllCard()
    res.json(card)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/card/by-suit-rank?suit=♠&rank=A ──────────────────────────────────
router.get('/by-suit-rank', async (req: Request, res: Response) => {
  const { suit, rank } = req.query as { suit?: string; rank?: string }
  if (!suit || !rank) {
    res.status(400).json({ error: 'suit and rank query params are required' })
    return
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

export default router
