import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import cors from 'cors'

import { errorHandler, notFound } from './middleware/errorHandler.js'
import dashboardRouter from './routes/dashboard.js'
import shipmentsRouter from './routes/shipments.js'
import disruptionsRouter from './routes/disruptions.js'
import fleetRouter from './routes/fleet.js'
import coldChainRouter from './routes/coldChain.js'
import routesRouter from './routes/routes.js'
import risksRouter from './routes/risks.js'
import recommendationsRouter from './routes/recommendations.js'
import alertsRouter from './routes/alerts.js'
import simulationRouter from './routes/simulation.js'
import aiRouter from './routes/ai.js'
import eventsRouter from './routes/events.js'

import prisma from './lib/prisma.js'
import { generateLiveReading } from './services/coldChainService.js'

// ─── Express app ─────────────────────────────────────────────────────────────

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'chainguard-server' })
})

// API routes
app.use('/api/dashboard', dashboardRouter)
app.use('/api/shipments', shipmentsRouter)
app.use('/api/disruptions', disruptionsRouter)
app.use('/api/fleet', fleetRouter)
app.use('/api/cold-chain', coldChainRouter)
app.use('/api/routes', routesRouter)
app.use('/api/risks', risksRouter)
app.use('/api/recommendations', recommendationsRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/simulation', simulationRouter)
app.use('/api/ai', aiRouter)
app.use('/api/events', eventsRouter)

// 404 + error handler
app.use(notFound)
app.use(errorHandler)

// ─── HTTP + WebSocket server ──────────────────────────────────────────────────

const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

// Active WebSocket clients
const clients = new Set()

wss.on('connection', (ws, req) => {
  console.log(`[WS] Client connected (${clients.size + 1} total)`)
  clients.add(ws)

  // Send initial connection acknowledgement
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'CHAINguard live feed connected', timestamp: new Date().toISOString() }))

  ws.on('close', () => {
    clients.delete(ws)
    console.log(`[WS] Client disconnected (${clients.size} remaining)`)
  })

  ws.on('error', (err) => {
    console.error('[WS] Client error:', err.message)
    clients.delete(ws)
  })
})

/**
 * Broadcast a JSON message to all connected clients.
 */
function broadcast(payload) {
  const msg = JSON.stringify(payload)
  for (const client of clients) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(msg)
    }
  }
}

// ─── Live simulation broadcaster (every 15 seconds) ──────────────────────────

// Cold-chain shipment IDs that are actively monitored (isColdChain=true, in-transit)
const MONITORED_COLD_SHIPMENT_CODES = ['SHP-001', 'SHP-011', 'SHP-013', 'SHP-018', 'SHP-019', 'SHP-021', 'SHP-024', 'SHP-027']

let coldShipmentIds = []

async function loadColdShipmentIds() {
  try {
    const shipments = await prisma.shipment.findMany({
      where: { shipmentCode: { in: MONITORED_COLD_SHIPMENT_CODES } },
      select: { id: true, shipmentCode: true },
    })
    coldShipmentIds = shipments.map((s) => s.id)
  } catch {
    // DB may not be ready on first boot
  }
}

const DISRUPTION_NAMES = [
  'Mumbai Flash Floods',
  'Chennai Port Strike',
  'Red Sea Shipping Tensions',
  'Rajasthan NH48 Landslide',
]

async function broadcastLiveEvents() {
  if (clients.size === 0) return

  try {
    // 1. Emit a cold-chain temperature update for a random monitored shipment
    if (coldShipmentIds.length > 0) {
      const shipmentId = coldShipmentIds[Math.floor(Math.random() * coldShipmentIds.length)]
      const reading = await generateLiveReading(shipmentId)
      if (reading) {
        const event = {
          type: 'COLD_CHAIN_UPDATE',
          shipmentId,
          temperature: reading.temperature,
          safeMin: reading.safeMinTemp,
          safeMax: reading.safeMaxTemp,
          isExcursion: reading.isExcursion,
          severity: reading.isExcursion ? 'WARNING' : 'NORMAL',
          timestamp: new Date().toISOString(),
        }
        broadcast(event)

        // If excursion, also emit a NEW_ALERT
        if (reading.isExcursion) {
          broadcast({
            type: 'NEW_ALERT',
            alert: {
              shipmentId,
              alertType: reading.temperature > reading.safeMaxTemp ? 'TEMP_HIGH' : 'TEMP_LOW',
              severity: 'WARNING',
              temperature: reading.temperature,
              description: `Live: Temperature ${reading.temperature}°C ${reading.temperature > reading.safeMaxTemp ? 'exceeds' : 'below'} safe range`,
              createdAt: new Date().toISOString(),
            },
          })
        }
      }
    }

    // 2. Emit a random disruption update
    const disruption = await prisma.disruption.findFirst({
      where: { status: 'ACTIVE' },
      include: { _count: { select: { affectedShipments: true } } },
      orderBy: { createdAt: 'desc' },
      skip: Math.floor(Math.random() * 3),
    })
    if (disruption) {
      broadcast({
        type: 'DISRUPTION_UPDATE',
        disruptionId: disruption.id,
        name: disruption.name,
        severity: disruption.severity,
        affectedCount: disruption._count.affectedShipments,
        timestamp: new Date().toISOString(),
      })
    }

    // 3. Emit a fleet status update for a random asset
    const asset = await prisma.fleetAsset.findFirst({
      orderBy: { updatedAt: 'asc' },
      skip: Math.floor(Math.random() * 5),
    })
    if (asset) {
      broadcast({
        type: 'FLEET_STATUS',
        assetId: asset.id,
        assetCode: asset.assetCode,
        status: asset.status,
        utilization: asset.utilization,
        location: asset.currentLocation,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (err) {
    // Silently handle DB errors during broadcast (e.g. during shutdown)
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[WS Broadcaster]', err.message)
    }
  }
}

// ─── Start server ─────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 3001

httpServer.listen(PORT, async () => {
  console.log(`\n🚀 CHAINguard server running on http://localhost:${PORT}`)
  console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`)
  console.log(`📦 Environment: ${process.env.NODE_ENV ?? 'development'}\n`)

  await loadColdShipmentIds()
  // Start live event broadcaster
  setInterval(broadcastLiveEvents, 15_000)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[server] SIGTERM received — shutting down gracefully')
  httpServer.close()
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  httpServer.close()
  await prisma.$disconnect()
  process.exit(0)
})

export default app
