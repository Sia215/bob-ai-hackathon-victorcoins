import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// GET /api/events  — shipment events feed
router.get('/', async (req, res, next) => {
  try {
    const { shipmentId, limit = '20', eventType } = req.query
    const where = {}
    if (shipmentId) where.shipmentId = Number(shipmentId)
    if (eventType) where.eventType = eventType

    const events = await prisma.shipmentEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(Number(limit), 100),
      include: {
        shipment: { select: { id: true, shipmentCode: true, origin: true, destination: true } },
      },
    })
    res.json(events)
  } catch (err) {
    next(err)
  }
})

// POST /api/events  — create a manual shipment event
router.post('/', async (req, res, next) => {
  try {
    const { shipmentId, eventType, description, location } = req.body
    if (!shipmentId || !eventType || !description) {
      return res.status(400).json({ error: { message: 'shipmentId, eventType, and description are required', status: 400 } })
    }
    const event = await prisma.shipmentEvent.create({
      data: { shipmentId: Number(shipmentId), eventType, description, location: location ?? null },
      include: { shipment: { select: { id: true, shipmentCode: true } } },
    })
    res.status(201).json(event)
  } catch (err) {
    next(err)
  }
})

export default router
