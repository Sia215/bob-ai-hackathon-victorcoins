/**
 * disruptionService.js
 * Business logic for disruption queries and impact analysis.
 */
import prisma from '../lib/prisma.js'

/**
 * Return all disruptions with their affected shipment count.
 */
export async function getAllDisruptions() {
  const disruptions = await prisma.disruption.findMany({
    orderBy: { startTime: 'desc' },
    include: {
      affectedShipments: {
        select: { shipmentId: true },
      },
    },
  })
  return disruptions.map((d) => ({
    ...d,
    affectedCount: d.affectedShipments.length,
  }))
}

/**
 * Return a single disruption with full affected shipment list.
 */
export async function getDisruptionById(id) {
  const disruption = await prisma.disruption.findUnique({
    where: { id },
    include: {
      affectedShipments: {
        include: {
          shipment: {
            include: { carrier: true },
          },
        },
      },
    },
  })
  if (!disruption) return null
  return {
    ...disruption,
    affectedCount: disruption.affectedShipments.length,
  }
}

/**
 * Return only active disruptions (ACTIVE or MONITORING).
 */
export async function getActiveDisruptions() {
  return prisma.disruption.findMany({
    where: { status: { in: ['ACTIVE', 'MONITORING'] } },
    orderBy: [{ severity: 'desc' }, { startTime: 'desc' }],
    include: {
      affectedShipments: { select: { shipmentId: true } },
    },
  })
}

/**
 * Compute a concise disruption summary for dashboard use.
 */
export async function getDisruptionSummary() {
  const [active, total] = await Promise.all([
    prisma.disruption.count({ where: { status: { in: ['ACTIVE', 'MONITORING'] } } }),
    prisma.disruption.count(),
  ])
  return { activeDisruptions: active, totalDisruptions: total }
}
