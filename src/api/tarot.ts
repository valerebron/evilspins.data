import { Router, Request, Response } from 'express'
import {
  getAllTarot,
  getAllTape,
  getRandomTarot,
  getTarotById,
  getTarotByEsid,
  getTarotByTapeSide,
  getTarotByArtistId,
} from '../db/tarot'

const router = Router()

// ─── GET /api/tarot/tape ───────────────────────────────────────────────────────
router.get('/tape', async (_req: Request, res: Response) => {
  try {
    const tape = await getAllTape()
    res.json(tape)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/tarot ─────────────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const tarot = await getAllTarot()
    res.json(tarot)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/tarot/by-tape-side?tapeId=ES00&side=A ─────────────────────────────
router.get('/by-tape-side', async (req: Request, res: Response) => {
  const { tapeId, side } = req.query as { tapeId?: string; side?: string }
  if (!tapeId || !side) {
    res.status(400).json({ error: 'tapeId and side query params are required' })
    return
  }
  try {
    const tarot = await getTarotByTapeSide(tapeId, side)
    res.json(tarot)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/tarot/artist/:artistId ─────────────────────────────────────────
router.get('/artist/:artistId', async (req: Request, res: Response) => {
  const artistId = parseInt(req.params.artistId, 10)
  if (isNaN(artistId)) {
    res.status(400).json({ error: 'Invalid artistId' })
    return
  }
  try {
    const tarot = await getTarotByArtistId(artistId)
    res.json(tarot)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/tarot/esid/:esid ─────────────────────────────────────────────────
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

// ─── GET /api/tarot/random ───────────────────────────────────────────────────
router.get('/random', async (_req: Request, res: Response) => {
  try {
    const tarot = await getRandomTarot()
    if (!tarot) {
      res.status(404).json({ error: 'No tarot found' })
      return
    }
    res.json(tarot)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /api/tarot/:id ───────────────────────────────────────────────────────
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
