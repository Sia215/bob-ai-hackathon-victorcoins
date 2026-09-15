/**
 * recommendationService.js
 * Business logic for AI-driven recommendations.
 */
import prisma from '../lib/prisma.js'

export async function getPendingRecommendations() {
  return prisma.recommendation.findMany({
    where: { status: 'PENDING' },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    include: {
      shipment: { select: { id: true, shipmentCode: true, origin: true, destination: true, status: true } },
    },
  })
}

export async function getAllRecommendations() {
  return prisma.recommendation.findMany({
    orderBy: [{ createdAt: 'desc' }],
    include: {
      shipment: { select: { id: true, shipmentCode: true, origin: true, destination: true, status: true } },
    },
  })
}

export async function applyRecommendation(id) {
  return prisma.recommendation.update({
    where: { id },
    data: { status: 'APPLIED' },
  })
}

export async function dismissRecommendation(id) {
  return prisma.recommendation.update({
    where: { id },
    data: { status: 'DISMISSED' },
  })
}

/**
 * Create a new recommendation record from a service-generated suggestion.
 */
export async function createRecommendation(data) {
  return prisma.recommendation.create({ data })
}
