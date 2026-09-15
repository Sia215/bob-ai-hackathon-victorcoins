/**
 * routeService.js
 * Business logic for trade routes and alternatives.
 */
import prisma from '../lib/prisma.js'

export async function getAllRoutes() {
  return prisma.route.findMany({
    orderBy: { routeCode: 'asc' },
    include: { alternatives: true },
  })
}

export async function getRouteById(id) {
  return prisma.route.findUnique({
    where: { id },
    include: { alternatives: true },
  })
}

/**
 * Find routes that match a given origin/destination (case-insensitive partial match).
 */
export async function findRoutesForShipment(origin, destination) {
  return prisma.route.findMany({
    where: {
      origin: { contains: origin, mode: 'insensitive' },
      destination: { contains: destination, mode: 'insensitive' },
    },
    include: { alternatives: true },
  })
}
