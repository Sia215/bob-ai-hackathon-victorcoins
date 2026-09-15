import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { queryAI, saveMessage } from '../services/aiService.js'

const router = Router()

// POST /api/ai/query
router.post('/query', async (req, res, next) => {
  try {
    const { message, conversationId, context } = req.body
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: { message: 'message field is required', status: 400 } })
    }

    const result = await queryAI(message, context ?? null)

    // Persist conversation
    const { conversationId: savedConvoId } = await saveMessage({
      conversationId,
      role: 'user',
      content: message,
    })
    await saveMessage({
      conversationId: savedConvoId,
      role: 'assistant',
      content: result.response,
      dataContext: result.citations?.length ? result.citations : null,
    })

    res.json({ ...result, conversationId: savedConvoId })
  } catch (err) {
    next(err)
  }
})

// GET /api/ai/conversations
router.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await prisma.aiConversation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    res.json(conversations)
  } catch (err) {
    next(err)
  }
})

// GET /api/ai/conversations/:id
router.get('/conversations/:id', async (req, res, next) => {
  try {
    const convo = await prisma.aiConversation.findUnique({
      where: { id: Number(req.params.id) },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!convo) return res.status(404).json({ error: { message: 'Conversation not found', status: 404 } })
    res.json(convo)
  } catch (err) {
    next(err)
  }
})

export default router
