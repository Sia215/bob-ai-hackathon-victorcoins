import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { getFleetSummary } from '../services/fleetService.js'
import { getColdChainAlertCounts } from '../services/coldChainService.js'
import { getActiveDisruptions } from '../services/disruptionService.js'

const router = Router()

// GET /api/dashboard
router.get('/', async (req, res, next) => {
  try {
    const [
      totalShipments,
      atRiskShipments,
      criticalShipments,
      pendingRecommendations,
      fleetSummary,
      coldChainSummary,
      activeDisruptionsList,
      topRisks,
      recentEvents,
      cargoAtRiskAgg,
    ] = await Promise.all([
      prisma.shipment.count(),
      prisma.shipment.count({ where: { status: { in: ['AT_RISK', 'DELAYED'] } } }),
      prisma.riskAssessment.count({ where: { level: 'CRITICAL' } }),
      prisma.recommendation.count({ where: { status: 'PENDING' } }),
      getFleetSummary(),
      getColdChainAlertCounts(),
      getActiveDisruptions(),
      prisma.riskAssessment.findMany({
        orderBy: { score: 'desc' },
        take: 5,
        include: {
          shipment: { select: { id: true, shipmentCode: true, origin: true, destination: true, status: true, priority: true } },
        },
      }),
      prisma.shipmentEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          shipment: { select: { id: true, shipmentCode: true } },
        },
      }),
      prisma.riskAssessment.aggregate({
        where: { level: { in: ['HIGH', 'CRITICAL'] } },
        _sum: { score: true },
      }),
    ])

    // Compute cargo value at risk by joining to shipments
    const highRiskAssessments = await prisma.riskAssessment.findMany({
      where: { level: { in: ['HIGH', 'CRITICAL'] } },
      include: { shipment: { select: { value: true } } },
    })
    const cargoValueAtRisk = highRiskAssessments.reduce((sum, r) => sum + (r.shipment?.value ?? 0), 0)

    // Risk distribution for pie chart
    const riskCounts = await prisma.riskAssessment.groupBy({
      by: ['level'],
      _count: { level: true },
      orderBy: { level: 'asc' },
    })
    const riskDistribution = riskCounts.map((r) => ({
      level: r.level,
      count: r._count.level,
    }))

    // Fleet utilization by asset type for bar chart
    const allAssets = await prisma.fleetAsset.findMany({ select: { assetType: true, utilization: true } })
    const fleetUtilByType = allAssets.reduce((acc, a) => {
      const t = a.assetType || 'Other'
      if (!acc[t]) acc[t] = { type: t, total: 0, sumUtil: 0 }
      acc[t].total++
      acc[t].sumUtil += a.utilization ?? 0
      return acc
    }, {})
    const fleetUtilization = Object.values(fleetUtilByType).map((v) => ({
      type: v.type,
      utilization: v.total > 0 ? Math.round(v.sumUtil / v.total) : 0,
    }))

    // AI briefing bullet points
    const activeCount = activeDisruptionsList.filter((d) => d.status === 'ACTIVE').length
    const aiSummary = [
      `${criticalShipments} critical shipment${criticalShipments !== 1 ? 's' : ''} require immediate intervention.`,
      `${activeCount} active disruption${activeCount !== 1 ? 's' : ''} are affecting supply chain routes.`,
      `${fleetSummary.idle} idle fleet asset${fleetSummary.idle !== 1 ? 's' : ''} available for redeployment.`,
      `₹${(cargoValueAtRisk * 1e5 / 1e7).toFixed(1)}Cr of cargo value is currently at risk.`,
      `${coldChainSummary.activeColdChainAlerts} cold-chain alert${coldChainSummary.activeColdChainAlerts !== 1 ? 's' : ''} detected — regulatory action may be required.`,
    ]

    res.json({
      kpis: {
        totalShipments,
        atRiskShipments,
        criticalShipments,
        activeDisruptions: activeCount,
        fleetUtilization: fleetSummary.avgUtilization,
        idleAssets: fleetSummary.idle,
        coldChainAlerts: coldChainSummary.activeColdChainAlerts,
        cargoValueAtRisk: Math.round(cargoValueAtRisk * 1e5),
      },
      riskDistribution,
      fleetUtilization,
      aiSummary,
      pendingRecommendations,
      recentEvents,
      topRisks,
      activeDisruptionsList: activeDisruptionsList.slice(0, 5),
    })
  } catch (err) {
    next(err)
  }
})

export default router
