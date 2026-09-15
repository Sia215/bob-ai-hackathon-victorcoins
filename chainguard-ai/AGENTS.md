# AGENTS.md — CHAINguard AI

This file provides IBM Bob and other AI agents with comprehensive context for understanding, maintaining, and extending this codebase.

---

## Project Purpose

CHAINguard AI is a full-stack AI-powered logistics command center built for the IBM Bob Hackathon (L2 — Supply Chain Disruption Assistant & Fleet Utilisation Optimizer).

It solves four real-world supply chain problems:
1. Identifying shipments affected by active disruptions
2. Recommending alternative routes and carriers
3. Identifying and redeploying idle fleet assets
4. Monitoring cold-chain IoT sensor data and classifying regulatory severity

---

## Monorepo Structure

```
bob-ai-hackathon-entry/
├── chainguard-ai/          React + Vite frontend (port 5173)
│   ├── src/
│   │   ├── api/            API client + hooks
│   │   ├── components/     Reusable UI components
│   │   │   ├── layout/     AppShell, Sidebar, TopBar
│   │   │   ├── ui/         KpiCard, RiskBadge, Modal, Toast, etc.
│   │   │   ├── charts/     Recharts wrappers
│   │   │   ├── globe/      3D React Three Fiber globe
│   │   │   └── ai/         Copilot floating panel + full page
│   │   ├── context/        DemoContext (demo mode state)
│   │   ├── hooks/          useApi, useWebSocket, useToast
│   │   ├── pages/          11 page components
│   │   └── services/       (legacy — logic migrated to server)
│   └── package.json
└── server/                 Express.js backend (port 3001)
    ├── prisma/
    │   ├── schema.prisma   20-model PostgreSQL schema
    │   └── seed.js         Comprehensive seed data
    └── src/
        ├── index.js        Express entry + WebSocket
        ├── lib/prisma.js   Prisma client singleton
        ├── middleware/     Error handler
        ├── routes/         12 Express routers
        └── services/       8 business logic services
```

---

## Architecture Conventions

### Frontend
- **All data fetching** happens in page-level components using `useApi(path)` hook
- **Never fetch data** inside deeply nested child components — pass as props
- **API base URL** is `VITE_API_URL` env var, defaults to `http://localhost:3001/api`
- The Vite dev server proxies `/api/*` and `/ws` to `localhost:3001`
- **React Router** is used for navigation — all routes defined in `src/App.jsx`
- **DemoContext** provides `demoMode`, `demoStep`, `triggerDemo()`, `resetDemo()` globally

### Backend
- **ES modules** (`"type": "module"`) — use `import`/`export` everywhere
- **Prisma client** singleton lives in `src/lib/prisma.js` — import from there
- **All database access** through Prisma — no raw SQL
- Route handlers are thin — call service functions for business logic
- Services are pure functions that accept Prisma client as parameter when needed

---

## Database Conventions

### Prisma Schema Rules
- All models use `Int @id @default(autoincrement())`
- All models have `createdAt DateTime @default(now())`
- Models with mutable state have `updatedAt DateTime @updatedAt`
- Camel case field names in Prisma → snake_case in PostgreSQL (automatic)
- Many-to-many relationships use explicit join tables (e.g., `DisruptionShipment`)

### Key Field Conventions
- `shipmentCode` format: `SHP-001` through `SHP-030`
- `disruptionCode` format: `DSR-001` through `DSR-008`
- `assetCode` format: `FLT-001` through `FLT-015`
- `carrierCode` format: `CAR-001` through `CAR-008`
- `routeCode` format: `RTE-001` through `RTE-020`
- Priority values: `"LOW" | "MEDIUM" | "HIGH" | "CRITICAL"`
- Status values (shipments): `"PENDING" | "IN_TRANSIT" | "DELAYED" | "AT_RISK" | "DELIVERED"`
- Status values (fleet): `"ACTIVE" | "IDLE" | "MAINTENANCE" | "STRANDED"`
- Severity values: `"LOW" | "MEDIUM" | "HIGH" | "CRITICAL"`

### Geo Coordinates (key hubs)
| City | Lat | Lng |
|---|---|---|
| Mumbai | 19.0760 | 72.8777 |
| Delhi | 28.6139 | 77.2090 |
| Chennai | 13.0827 | 80.2707 |
| Bengaluru | 12.9716 | 77.5946 |
| Ahmedabad | 23.0225 | 72.5714 |
| Kolkata | 22.5726 | 88.3639 |
| Pune | 18.5204 | 73.8567 |
| Dubai | 25.2048 | 55.2708 |
| Singapore | 1.3521 | 103.8198 |
| Rotterdam | 51.9244 | 4.4777 |
| Shanghai | 31.2304 | 121.4737 |
| Los Angeles | 34.0522 | -118.2437 |

---

## API Conventions

### Request/Response Format
All API responses use this structure:
```json
{ "success": true, "data": {...} }
{ "success": false, "error": "Human-readable message" }
```

### Error Handling
Every route uses try/catch and passes to `next(error)` → `errorHandler` middleware.
HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Internal Server Error.

### Route File Pattern
```javascript
import express from 'express'
import prisma from '../lib/prisma.js'
import { someService } from '../services/someService.js'

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const data = await someService.getAll(prisma)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
})

export default router
```

---

## Risk Engine Rules

The risk engine (`server/src/services/riskService.js`) produces scores 0–100:

| Factor | Max Points | Calculation |
|---|---|---|
| Disruption Severity | 30 | CRITICAL=30, HIGH=20, MEDIUM=12, LOW=5; multiplied by disruption count |
| Delay Status | 20 | ≥48h=20, ≥24h=15, ≥12h=10, ≥1h=5 |
| Priority | 20 | CRITICAL=20, HIGH=15, MEDIUM=8, LOW=3 |
| Route Exposure | 15 | Based on active disruptions near the route |
| Cold-Chain | 15 | CRITICAL=15, WARNING=8, NORMAL=0 |
| Carrier Deduction | -5 | Subtract if carrier reliability > 0.95 |

Risk Levels: 0–24=LOW, 25–49=MEDIUM, 50–74=HIGH, 75–100=CRITICAL

The `explanation` field must always be a human-readable string listing which factors contributed and why.

---

## AI Service Rules

The AI service (`server/src/services/aiService.js`) must:

1. **Never invent database records** — all IDs, names, and values must come from Prisma queries
2. **Try watsonx first** if `WATSONX_API_KEY` is set in environment
3. **Fall back to local engine** if watsonx is unavailable or credentials are missing
4. **Persist conversations** to `AiConversation` and `AiMessage` tables
5. **Return structured actions** for operational intents (reroute, redeploy, etc.)

### Supported Intent Categories
- `highest_risk` — top N shipments by risk score
- `shipment_detail` — full detail for a specific shipment ID
- `disruption_affected` — shipments affected by a named disruption
- `idle_fleet` — assets with status IDLE
- `cold_chain_alerts` — readings with excursions
- `prioritize_today` — ranked action list
- `cargo_value_at_risk` — sum of shipment.value for at-risk shipments
- `what_if` — hand off to simulationService
- `delayed_shipments` — shipments with delayHours > 0
- `alternative_routes` — routes with lower risk for a shipment

---

## 3D Visualization Conventions

The globe component (`chainguard-ai/src/components/globe/LogisticsGlobe.jsx`) uses React Three Fiber.

**Color coding:**
- GREEN `#22c55e` — LOW risk shipment arc
- YELLOW `#f59e0b` — MEDIUM risk
- ORANGE `#f97316` — HIGH risk  
- RED `#ef4444` — CRITICAL risk
- CYAN `#06b6d4` — Cold-chain monitored shipment
- PURPLE `#a855f7` — Disruption zone

**Performance rules:**
- Max 30 shipment arcs visible at once
- Use `useMemo` for arc geometry calculations
- Disruption spheres use `useFrame` for pulsing animation
- Always wrap globe in `<Suspense>` with fallback

---

## Security Rules

1. **Never hardcode credentials** — use `process.env.*` on backend, `import.meta.env.VITE_*` on frontend
2. **Never expose backend env vars to frontend** — only `VITE_` prefixed vars reach the browser
3. **Use Prisma for all DB access** — never concatenate user input into queries
4. **Validate request bodies** with Zod in route handlers
5. **CORS** is configured via `CORS_ORIGIN` env var — not wildcard in production
6. **No API keys in frontend code** — watsonx credentials stay server-side only

---

## Development Commands

```bash
# Frontend
cd chainguard-ai
npm run dev          # Dev server port 5173
npm run build        # Production build
npm run lint         # oxlint

# Backend
cd server
npm run dev          # nodemon port 3001
npm start            # production

# Database
cd server
npx prisma db push   # Push schema to DB
npx prisma generate  # Regenerate client
node prisma/seed.js  # Seed data
npx prisma studio    # DB GUI (port 5555)
```

---

## Testing Checklist

Before marking any work complete:
1. `npm run build` in `chainguard-ai/` must succeed with no errors
2. `npm run dev` in both `server/` and `chainguard-ai/` must start without crashes
3. All 11 nav pages must load without blank screens
4. Dashboard KPI cards must show numbers (not 0 or undefined)
5. Shipments table must show data from API
6. AI Copilot floating button must be visible on all pages
7. Simulation Lab "Run Simulation" must return before/after data
8. 3D Globe must render (may show fallback positions if backend is down)

---

## Known Issues & Workarounds

- **Three.js chunk size warning**: Expected — LogisticsGlobe is lazy-loaded, warning is advisory only
- **React 19 peer dependency**: Use `--legacy-peer-deps` when installing packages that haven't updated to React 19 yet
- **PostgreSQL required**: The backend will not start without a valid `DATABASE_URL`. For demo without Postgres, the frontend has local fallback data in `src/data/` for the previous version.

---

## Extension Points

To add a new feature:

1. **New page**: Create `src/pages/NewPage.jsx`, add route in `src/App.jsx`, add nav item in `src/components/layout/Sidebar.jsx`
2. **New API endpoint**: Create/update file in `server/src/routes/`, register in `server/src/index.js`
3. **New service**: Create `server/src/services/newService.js`, import in relevant route
4. **New AI intent**: Add case to `aiService.js` intent matcher, add query logic, update response formatter
5. **New DB model**: Add to `prisma/schema.prisma`, run `npx prisma db push`, add seed data in `seed.js`

---

## IBM Bob Integration Notes

This project was built entirely with IBM Bob in Agent mode. Bob is the recommended tool for:
- Adding new features (Bob understands the architecture conventions above)
- Debugging API issues (Bob can read both frontend and backend simultaneously)
- Extending the seed data (Bob knows the data relationships)
- Adding new AI intents to the Copilot
- Modifying the risk engine weights

When asking Bob to add a feature, provide:
1. The feature description
2. Which layer(s) it touches (frontend/backend/both)
3. Any specific entity IDs or data relationships it needs
