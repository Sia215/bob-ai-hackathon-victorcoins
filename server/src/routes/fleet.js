import { Router } from 'express'
import { getAllFleetAssets, getFleetAssetById, getFleetSummary } from '../services/fleetService.js'

const router = Router()

// GET /api/fleet
router.get('/', async (req, res, next) => {
  try {
    const [assets, summary] = await Promise.all([getAllFleetAssets(), getFleetSummary()])
    res.json({ summary, assets })
  } catch (err) {
    next(err)
  }
})

// GET /api/fleet/:id
router.get('/:id', async (req, res, next) => {
  try {
    const asset = await getFleetAssetById(Number(req.params.id))
    if (!asset) return res.status(404).json({ error: { message: 'Fleet asset not found', status: 404 } })
    res.json(asset)
  } catch (err) {
    next(err)
  }
})

export default router
