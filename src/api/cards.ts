import { Router, Request, Response } from 'express'
import {
  getAllCards,
  getCardById,
  getCardByEsid,
  getCardBySlug,
  getCardsByDate,
  getCardsBySuitAndRank,
} from '../db/cards'
import { scanCards } from '../scanner'

const router = Router()

// ─── GET /api/cards ─────────────────────────────────────────────────────────────
// Returns all cards, ordered by date added.
router.get('/', async (_req: Request, res: Response) => {
  try {
    const cards = await getAllCards()
    res.json(cards)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/cards/by-suit-rank?suit=♠&rank=A ──────────────────────────────────
router.get('/by-suit-rank', async (req: Request, res: Response) => {
  const { suit, rank } = req.query as { suit?: string; rank?: string }
  if (!suit || !rank) {
    res.status(400).json({ error: 'suit and rank query params are required' })
    return
  }
  try {
    const cards = await getCardsBySuitAndRank(suit, rank)
    res.json(cards)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/cards/by-date?year=2024&month=9&day=15&hour=22 ────────────────────
router.get('/by-date', async (req: Request, res: Response) => {
  const { year, month, day, hour } = req.query as Record<string, string>
  if (!year || !month || !day || !hour) {
    res.status(400).json({ error: 'year, month, day and hour are required' })
    return
  }
  try {
    const cards = await getCardsByDate(+year, +month, +day, +hour)
    res.json(cards)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/cards/esid/:esid ──────────────────────────────────────────────────
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

// ─── GET /api/cards/slug/:slug ───────────────────────────────────────────────────
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

// ─── GET /api/cards/:id ─────────────────────────────────────────────────────────
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

// ─── POST /apicards/rescan ─────────────────────────────────────────────────────
// Manually trigger a full re-scan (useful during development).
router.post('/rescan', async (_req: Request, res: Response) => {
  try {
    const result = await scanCards()
    res.json({ ok: true, ...result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Scan failed' })
  }
})

export default router
