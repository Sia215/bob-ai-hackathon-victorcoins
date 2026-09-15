import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// GET /api/alerts  — returns unread notifications
router.get('/', async (req, res, next) => {
  try {
    const { all } = req.query
    const where = all === 'true' ? {} : { isRead: false }
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    res.json(notifications)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/alerts/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: Number(req.params.id) },
      data: { isRead: true },
    })
    res.json(notification)
  } catch (err) {
    next(err)
  }
})

// POST /api/alerts/mark-all-read
router.post('/mark-all-read', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
