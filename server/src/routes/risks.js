import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { calculateRisk } from '../services/riskService.js'

const router = Router()

// GET /api/risks
router.get('/', async (req, res, next) => {
  try {
    const assessments = await prisma.riskAssessment.findMany({
      orderBy: { score: 'desc' },
      include: {
        shipment: {
          select: { id: true, shipmentCode: true, origin: true, destination: true, status: true, priority: true, carrierId: true },
        },
      },
    })
    res.json(assessments)
  } catch (err) {
    next(err)
  }
})

// POST /api/risks/recalculate/:shipmentId
// Recalculates the risk score for a given shipment on demand and persists it.
router.post('/recalculate/:shipmentId', async (req, res, next) => {
  try {
    const shipmentId = Number(req.params.shipmentId)
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        carrier: true,
        affectedDisruptions: { include: { disruption: true } },
        coldChainReadings: { orderBy: { timestamp: 'desc' }, take: 20 },
      },
    })
    if (!shipment) return res.status(404).json({ error: { message: 'Shipment not found', status: 404 } })

    const disruptions = shipment.affectedDisruptions.map((ad) => ad.disruption)
    const result = calculateRisk(shipment, disruptions, shipment.coldChainReadings)

    const saved = await prisma.riskAssessment.create({
      data: {
        shipmentId,
        score: result.score,
        level: result.level,
        disruptionScore: result.disruptionScore,
        delayScore: result.delayScore,
        priorityScore: result.priorityScore,
        routeScore: result.routeScore,
        coldChainScore: result.coldChainScore,
        carrierScore: result.carrierScore,
        explanation: result.explanation,
      },
    })
    res.json({ ...saved, factors: result.factors })
  } catch (err) {
    next(err)
  }
})

export default router
