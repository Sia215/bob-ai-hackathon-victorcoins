import { Router } from 'express'
import {
  getPendingRecommendations,
  getAllRecommendations,
  applyRecommendation,
  dismissRecommendation,
} from '../services/recommendationService.js'

const router = Router()

// GET /api/recommendations
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query
    const recs = status === 'all' ? await getAllRecommendations() : await getPendingRecommendations()
    res.json(recs)
  } catch (err) {
    next(err)
  }
})

// POST /api/recommendations/:id/apply
router.post('/:id/apply', async (req, res, next) => {
  try {
    const rec = await applyRecommendation(Number(req.params.id))
    res.json(rec)
  } catch (err) {
    next(err)
  }
})

// POST /api/recommendations/:id/dismiss
router.post('/:id/dismiss', async (req, res, next) => {
  try {
    const rec = await dismissRecommendation(Number(req.params.id))
    res.json(rec)
  } catch (err) {
    next(err)
  }
})

export default router
