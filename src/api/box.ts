import { Router, Request, Response } from 'express'
import { getAllBoxes, getBoxById, getCardsByBoxId } from '../db/box'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const boxes = await getAllBoxes()
    res.json(boxes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const box = await getBoxById(req.params.id)
    if (!box) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    const cards = await getCardsByBoxId(req.params.id)
    res.json({ ...box, cards })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
