/**
 * coldChainService.js
 * Business logic for cold-chain monitoring.
 */
import prisma from '../lib/prisma.js'

/**
 * Return all cold-chain shipments with their latest readings and alerts.
 */
export async function getColdChainOverview() {
  const shipments = await prisma.shipment.findMany({
    where: { isColdChain: true },
    include: {
      carrier: true,
      coldChainReadings: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
      coldChainAlerts: {
        where: { resolvedAt: null },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return shipments.map((s) => ({
    ...s,
    latestReading: s.coldChainReadings[0] ?? null,
    activeAlerts: s.coldChainAlerts,
    hasActiveAlert: s.coldChainAlerts.length > 0,
  }))
}

/**
 * Return all readings + alerts for a specific shipment.
 */
export async function getReadingsForShipment(shipmentId) {
  const [readings, alerts] = await Promise.all([
    prisma.coldChainReading.findMany({
      where: { shipmentId },
      orderBy: { timestamp: 'asc' },
    }),
    prisma.coldChainAlert.findMany({
      where: { shipmentId },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  return { readings, alerts }
}

/**
 * Summary counts for dashboard.
 */
export async function getColdChainAlertCounts() {
  const [active, total] = await Promise.all([
    prisma.coldChainAlert.count({ where: { resolvedAt: null } }),
    prisma.coldChainAlert.count(),
  ])
  return { activeColdChainAlerts: active, totalColdChainAlerts: total }
}

/**
 * Simulate a new live reading (used by WebSocket broadcaster).
 * Returns a realistic temperature close to the latest reading.
 */
export async function generateLiveReading(shipmentId) {
  const latest = await prisma.coldChainReading.findFirst({
    where: { shipmentId },
    orderBy: { timestamp: 'desc' },
  })
  if (!latest) return null
  const variation = (Math.random() - 0.5) * 0.8
  const newTemp = Math.round((latest.temperature + variation) * 10) / 10
  return {
    shipmentId,
    temperature: newTemp,
    safeMinTemp: latest.safeMinTemp,
    safeMaxTemp: latest.safeMaxTemp,
    isExcursion: newTemp > latest.safeMaxTemp || newTemp < latest.safeMinTemp,
  }
}
