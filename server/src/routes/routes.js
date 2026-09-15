import { Router } from 'express'
import { getAllRoutes, getRouteById, findRoutesForShipment } from '../services/routeService.js'

const router = Router()

// GET /api/routes
router.get('/', async (req, res, next) => {
  try {
    const { origin, destination } = req.query
    if (origin && destination) {
      const routes = await findRoutesForShipment(origin, destination)
      return res.json(routes)
    }
    res.json(await getAllRoutes())
  } catch (err) {
    next(err)
  }
})

// GET /api/routes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const route = await getRouteById(Number(req.params.id))
    if (!route) return res.status(404).json({ error: { message: 'Route not found', status: 404 } })
    res.json(route)
  } catch (err) {
    next(err)
  }
})

export default router
