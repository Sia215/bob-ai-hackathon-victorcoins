import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// GET /api/shipments
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, isColdChain, carrierId } = req.query
    const where = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (isColdChain !== undefined) where.isColdChain = isColdChain === 'true'
    if (carrierId) where.carrierId = Number(carrierId)

    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        carrier: true,
        riskAssessments: { orderBy: { calculatedAt: 'desc' }, take: 1 },
        recommendations: { where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' }, take: 1 },
        coldChainAlerts: { where: { resolvedAt: null }, select: { id: true, severity: true } },
        _count: { select: { affectedDisruptions: true } },
      },
    })

    res.json(shipments.map((s) => ({
      ...s,
      latestRisk: s.riskAssessments[0] ?? null,
      latestRecommendation: s.recommendations[0] ?? null,
      activeAlertCount: s.coldChainAlerts.length,
      disruptionCount: s._count.affectedDisruptions,
    })))
  } catch (err) {
    next(err)
  }
})

// GET /api/shipments/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        carrier: true,
        shipmentEvents: { orderBy: { timestamp: 'desc' } },
        coldChainReadings: { orderBy: { timestamp: 'asc' } },
        coldChainAlerts: { orderBy: { createdAt: 'desc' } },
        riskAssessments: { orderBy: { calculatedAt: 'desc' }, take: 3 },
        recommendations: { orderBy: { createdAt: 'desc' } },
        fleetAssignments: {
          include: { asset: true },
          orderBy: { assignedAt: 'desc' },
          take: 3,
        },
        affectedDisruptions: {
          include: { disruption: true },
        },
      },
    })
    if (!shipment) return res.status(404).json({ error: { message: 'Shipment not found', status: 404 } })
    res.json(shipment)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/shipments/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { status } = req.body
    const allowed = ['PENDING', 'IN_TRANSIT', 'DELAYED', 'AT_RISK', 'DELIVERED']
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: { message: `Invalid status. Must be one of: ${allowed.join(', ')}`, status: 400 } })
    }
    const updated = await prisma.shipment.update({ where: { id }, data: { status } })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

export default router
