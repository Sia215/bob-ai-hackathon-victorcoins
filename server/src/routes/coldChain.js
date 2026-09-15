import { Router } from 'express'
import { getColdChainOverview, getReadingsForShipment } from '../services/coldChainService.js'
import prisma from '../lib/prisma.js'

const router = Router()

// GET /api/cold-chain
router.get('/', async (req, res, next) => {
  try {
    const [overview, alerts] = await Promise.all([
      getColdChainOverview(),
      prisma.coldChainAlert.findMany({
        where: { resolvedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          shipment: { select: { id: true, shipmentCode: true, origin: true, destination: true, cargoType: true } },
        },
      }),
    ])
    res.json({ shipments: overview, activeAlerts: alerts })
  } catch (err) {
    next(err)
  }
})

// GET /api/cold-chain/:shipmentId/readings
router.get('/:shipmentId/readings', async (req, res, next) => {
  try {
    const data = await getReadingsForShipment(Number(req.params.shipmentId))
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/cold-chain/alerts/:id/resolve
router.patch('/alerts/:id/resolve', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const alert = await prisma.coldChainAlert.update({
      where: { id },
      data: { resolvedAt: new Date() },
    })
    res.json(alert)
  } catch (err) {
    next(err)
  }
})

export default router
