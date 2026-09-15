import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { runSimulation } from '../services/simulationService.js'

const router = Router()

// POST /api/simulation
router.post('/', async (req, res, next) => {
  try {
    const { disruptionId, severityMultiplier = 1.0, durationHours = 0, affectedRadiusKm } = req.body

    if (!disruptionId) {
      return res.status(400).json({ error: { message: 'disruptionId is required', status: 400 } })
    }

    // Load disruption + all shipments with required relations
    const [disruption, shipments] = await Promise.all([
      prisma.disruption.findUnique({ where: { id: Number(disruptionId) } }),
      prisma.shipment.findMany({
        include: {
          carrier: true,
          affectedDisruptions: { include: { disruption: true } },
          coldChainReadings: { orderBy: { timestamp: 'desc' }, take: 12 },
        },
      }),
    ])

    if (!disruption) {
      return res.status(404).json({ error: { message: 'Disruption not found', status: 404 } })
    }

    const result = runSimulation(
      { disruptionId: disruption.id, severityMultiplier, durationHours, affectedRadiusKm },
      { disruption, shipments }
    )

    // Persist scenario + result
    const scenario = await prisma.simulationScenario.create({
      data: {
        name: `${disruption.name} ×${severityMultiplier} +${durationHours}h`,
        baselineData: JSON.stringify(result.baseline),
        parameters: JSON.stringify({ disruptionId, severityMultiplier, durationHours, affectedRadiusKm }),
        results: {
          create: {
            affectedShipments: result.simulated.affectedShipments,
            criticalShipments: result.simulated.criticalShipments,
            estimatedDelays: JSON.stringify(result.delta),
            cargoValueAtRisk: result.simulated.cargoValueAtRisk,
            fleetUtilization: 0,
            coldChainAlerts: result.simulated.coldChainAlerts,
            recommendations: JSON.stringify(result.recommendations),
          },
        },
      },
      include: { results: true },
    })

    res.json({ ...result, scenarioId: scenario.id })
  } catch (err) {
    next(err)
  }
})

// GET /api/simulation/history
router.get('/history', async (req, res, next) => {
  try {
    const scenarios = await prisma.simulationScenario.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { results: { orderBy: { calculatedAt: 'desc' }, take: 1 } },
    })
    res.json(scenarios)
  } catch (err) {
    next(err)
  }
})

export default router
