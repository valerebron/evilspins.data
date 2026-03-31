import { Router, Request, Response } from 'express'
import {
  getAllTarots,
  getTarotById,
  getTarotByEsid,
  getTarotsByTapeSide,
  getTarotsByArtistId,
} from '../db/tarot'

const router = Router()

// ─── GET /api/tarots ─────────────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const tarots = await getAllTarots()
    res.json(tarots)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/tarots/by-tape-side?tapeId=ES00&side=A ─────────────────────────────
router.get('/by-tape-side', async (req: Request, res: Response) => {
  const { tapeId, side } = req.query as { tapeId?: string; side?: string }
  if (!tapeId || !side) {
    res.status(400).json({ error: 'tapeId and side query params are required' })
    return
  }
  try {
    const tarots = await getTarotsByTapeSide(tapeId, side)
    res.json(tarots)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/tarots/artist/:artistId ─────────────────────────────────────────
router.get('/artist/:artistId', async (req: Request, res: Response) => {
  const artistId = parseInt(req.params.artistId, 10)
  if (isNaN(artistId)) {
    res.status(400).json({ error: 'Invalid artistId' })
    return
  }
  try {
    const tarots = await getTarotsByArtistId(artistId)
    res.json(tarots)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/tarots/esid/:esid ─────────────────────────────────────────────────
router.get('/esid/:esid', async (req: Request, res: Response) => {
  try {
    const tarot = await getTarotByEsid(req.params.esid)
    if (!tarot) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(tarot)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/tarots/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  try {
    const tarot = await getTarotById(id)
    if (!tarot) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(tarot)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
