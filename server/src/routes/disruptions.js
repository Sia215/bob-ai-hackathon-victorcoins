import { Router } from 'express'
import { getAllDisruptions, getDisruptionById } from '../services/disruptionService.js'

const router = Router()

// GET /api/disruptions
router.get('/', async (req, res, next) => {
  try {
    const disruptions = await getAllDisruptions()
    res.json(disruptions)
  } catch (err) {
    next(err)
  }
})

// GET /api/disruptions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const disruption = await getDisruptionById(Number(req.params.id))
    if (!disruption) return res.status(404).json({ error: { message: 'Disruption not found', status: 404 } })
    res.json(disruption)
  } catch (err) {
    next(err)
  }
})

export default router
