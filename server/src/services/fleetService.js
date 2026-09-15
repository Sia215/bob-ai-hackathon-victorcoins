/**
 * fleetService.js
 * Business logic for fleet asset queries and utilisation.
 */
import prisma from '../lib/prisma.js'

/**
 * Return all fleet assets with their current active assignment (if any).
 */
export async function getAllFleetAssets() {
  const assets = await prisma.fleetAsset.findMany({
    orderBy: { assetCode: 'asc' },
    include: {
      carrier: true,
      assignments: {
        where: { status: 'ACTIVE' },
        include: {
          shipment: { select: { id: true, shipmentCode: true, origin: true, destination: true, status: true } },
        },
        orderBy: { assignedAt: 'desc' },
        take: 1,
      },
    },
  })
  return assets.map((a) => ({
    ...a,
    currentAssignment: a.assignments[0] ?? null,
  }))
}

/**
 * Return fleet utilisation summary.
 */
export async function getFleetSummary() {
  const assets = await prisma.fleetAsset.findMany({ select: { status: true, utilization: true } })
  const total = assets.length
  const active = assets.filter((a) => a.status === 'ACTIVE').length
  const idle = assets.filter((a) => a.status === 'IDLE').length
  const maintenance = assets.filter((a) => a.status === 'MAINTENANCE').length
  const stranded = assets.filter((a) => a.status === 'STRANDED').length
  const avgUtilization = total > 0 ? assets.reduce((s, a) => s + a.utilization, 0) / total : 0
  return { total, active, idle, maintenance, stranded, avgUtilization: Math.round(avgUtilization * 100) / 100 }
}

/**
 * Return a single fleet asset with assignment history.
 */
export async function getFleetAssetById(id) {
  return prisma.fleetAsset.findUnique({
    where: { id },
    include: {
      carrier: true,
      assignments: {
        include: { shipment: true },
        orderBy: { assignedAt: 'desc' },
        take: 10,
      },
    },
  })
}
