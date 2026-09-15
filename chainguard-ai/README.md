# CHAINguard AI

**AI-Powered Supply Chain Disruption, Fleet Optimization & Cold-Chain Intelligence Platform**

*IBM Bob Hackathon Entry — L2: Supply Chain Disruption Assistant & Fleet Utilisation Optimizer*

---

## Problem Statement

Modern supply chain operations face four critical unsolved problems simultaneously:

1. **Disruption Blindness** — Shipment managers learn of disruptions hours after they occur, with no automated mapping of which shipments are affected.
2. **Manual Rerouting** — Alternative route and carrier decisions rely on human knowledge and phone calls, creating costly delays.
3. **Fleet Waste** — Idle assets worth millions sit unused while critical shipments are stranded, because there is no intelligent matching system.
4. **Cold-Chain Risk** — Temperature-sensitive cargo (pharmaceuticals, vaccines, perishables) suffers silent excursions that breach regulatory standards before anyone notices.

---

## Solution

**CHAINguard AI** is a full-stack AI-powered logistics command center that:

- **Detects disruptions** and instantly maps every affected shipment with calculated risk scores
- **Recommends alternative routes and carriers** using explainable, deterministic reasoning
- **Identifies idle fleet assets** and auto-recommends redeployment matches
- **Monitors cold-chain IoT sensors** in real time and classifies excursions against 5 regulatory frameworks
- **Provides an AI Copilot** (ChainGuard Copilot) that answers operational questions using live database data

The experience follows: **OBSERVE → UNDERSTAND → PREDICT → RECOMMEND → ACT**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                          │
│  Dashboard | Digital Twin | Shipments | Disruptions | Fleet      │
│  Cold Chain | Routes | Simulation Lab | Analytics | AI Copilot   │
└─────────────────────┬───────────────────────────────────────────┘
                      │ REST API + WebSocket
┌─────────────────────▼───────────────────────────────────────────┐
│                   Express.js Backend                              │
│  /api/dashboard  /api/shipments  /api/disruptions  /api/fleet    │
│  /api/cold-chain  /api/simulation  /api/ai/query  /api/alerts    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│           Business Logic Services                                 │
│  riskService | disruptionService | fleetService                  │
│  coldChainService | routeService | simulationService | aiService │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Prisma ORM
┌─────────────────────▼───────────────────────────────────────────┐
│                  PostgreSQL Database                              │
│  20 tables: shipments, disruptions, fleet_assets,                │
│  cold_chain_readings, risk_assessments, recommendations, ...     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| 3D Visualization | Three.js, React Three Fiber, @react-three/drei |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router DOM v6 |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Real-time | WebSocket (ws library) |
| AI | watsonx.ai (with local fallback engine) |

---

## Key Features

### 1. 3D Digital Twin Globe
Interactive Three.js globe showing:
- Animated shipment arcs colored by risk (green/yellow/orange/red/cyan)
- Pulsing disruption zones
- Hub markers at 12 global logistics nodes
- OrbitControls (zoom/rotate/pan)
- Starfield background

### 2. Explainable AI Risk Engine
5-factor transparent scoring (0–100):
- Disruption severity (0–30 pts)
- Delay status (0–20 pts)
- Shipment priority (0–20 pts)
- Route exposure (0–15 pts)
- Cold-chain condition (0–15 pts)

Every score comes with a human-readable explanation citing actual entity IDs.

### 3. AI Logistics Copilot (ChainGuard Copilot)
- Floating panel available on every page
- Full-screen dedicated page with action cards
- Answers 10+ intent types using live database data
- watsonx.ai integration with reliable local fallback
- Structured action recommendations with [View] [Simulate] [Apply] buttons

### 4. Cold-Chain Intelligence
- Real-time sensor monitoring
- Regulatory severity classification across 5 frameworks:
  - EU GMP Annex 15 (Pharmaceuticals)
  - WHO PQS E006 (Vaccines)
  - FDA 21 CFR §211.68 (US Pharma)
  - IATA DGR A152 (Dangerous Goods)
  - FSMA Sanitary Transport (Food)
- Critical excursion emergency modal
- Animated temperature sparklines

### 5. What-If Simulation Lab
- Adjust disruption severity, duration, radius, fleet availability
- Deterministic calculation engine (no randomness)
- Before/after comparison with delta indicators
- AI recommendations for simulated scenario

### 6. Demo Mode
One-click 8-step demo sequence demonstrating the full platform value:
1. Activate Mumbai flood disruption
2. Animate affected routes to warning state
3. Show AI recommendations
4. Trigger cold-chain alert
5. Show fleet redeployment recommendation
6. Complete summary

---

## Database Schema

| Table | Description |
|---|---|
| `users` | Platform users |
| `carriers` | Logistics carriers (8 seeded) |
| `shipments` | 30 shipments with geo coordinates |
| `shipment_events` | Event timeline per shipment |
| `disruptions` | 8 active disruptions |
| `disruption_shipments` | Many-to-many: disruption ↔ shipment |
| `routes` | 20 logistics routes |
| `route_alternatives` | Alternative routes per main route |
| `fleet_assets` | 15 fleet assets |
| `fleet_assignments` | Asset ↔ shipment assignments |
| `cold_chain_readings` | 100+ IoT sensor readings |
| `cold_chain_alerts` | Temperature excursion alerts |
| `risk_assessments` | Calculated risk scores |
| `recommendations` | AI-generated operational actions |
| `notifications` | Alert center entries |
| `ai_conversations` | Copilot conversation history |
| `ai_messages` | Individual messages per conversation |
| `simulation_scenarios` | Saved what-if scenarios |
| `simulation_results` | Calculation results per scenario |
| `audit_logs` | Action audit trail |

---

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# 1. Clone / navigate to the project
cd chainguard-ai-hackathon

# 2. Install frontend dependencies
cd chainguard-ai
npm install

# 3. Install backend dependencies
cd ../server
npm install

# 4. Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL to your PostgreSQL connection string

# 5. Set up database
npx prisma db push
npx prisma generate

# 6. Seed database with demo data
node prisma/seed.js
```

### Running

```bash
# Terminal 1: Start backend
cd server
npm run dev        # Starts on port 3001

# Terminal 2: Start frontend
cd chainguard-ai
npm run dev        # Starts on port 5173
```

Open http://localhost:5173

---

## Environment Variables

```env
# server/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/chainguard"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Optional: IBM watsonx.ai credentials
WATSONX_API_KEY=your_api_key
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_PROJECT_ID=your_project_id
```

The application works fully without watsonx credentials — the local AI fallback engine handles all queries.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/dashboard | KPIs, top risks, AI briefing, events |
| GET | /api/shipments | All shipments with risk + carrier |
| GET | /api/shipments/:id | Full shipment detail |
| PATCH | /api/shipments/:id/status | Update shipment status |
| GET | /api/disruptions | All disruptions with impact counts |
| GET | /api/disruptions/:id | Disruption with affected shipments |
| GET | /api/fleet | Fleet assets with assignments |
| GET | /api/cold-chain | Sensor readings + alerts |
| GET | /api/routes | Routes with alternatives |
| GET | /api/risks | All risk assessments |
| POST | /api/risks/recalculate | Recalculate risk for shipment |
| GET | /api/recommendations | All pending recommendations |
| PATCH | /api/recommendations/:id | Apply/dismiss recommendation |
| GET | /api/alerts | All notifications |
| PATCH | /api/alerts/:id/read | Mark alert as read |
| POST | /api/simulation | Run what-if simulation |
| POST | /api/ai/query | AI Copilot query |
| GET | /api/events | Event timeline |
| WebSocket | ws://localhost:3001/ws | Real-time updates |

---

## Demo Instructions

1. Open http://localhost:5173
2. The **Dashboard** loads with 8 KPI cards and the 3D globe
3. Click **"Digital Twin"** in sidebar → see the animated globe with shipment arcs
4. Click the **"Demo Mode"** button in the top bar → watch the 8-step demonstration
5. Navigate to **Disruptions** → click "Mumbai Floods" → see affected shipments
6. Click a critical shipment → see the explainable risk breakdown
7. Navigate to **Cold Chain** → see regulatory compliance violations
8. Click the **🤖 AI** button (bottom-right) → ask "What should I prioritize right now?"
9. Navigate to **Simulation Lab** → adjust Mumbai disruption → click "Run Simulation"
10. Navigate to **AI Copilot** → see structured action recommendations

---

## Example AI Copilot Questions

```
Which shipments are at highest risk?
Why is S-014 critical?
Which shipments are affected by the Mumbai floods?
Which trucks are idle right now?
Which fleet assets should be redeployed?
Which cold-chain shipments have temperature excursions?
What should we prioritize today?
How much cargo value is at risk?
Which alternative route is best for S-014?
What happens if the Mumbai disruption continues for 12 more hours?
Show me all critical shipments
How many shipments are delayed?
```

---

## How IBM Bob Was Used

IBM Bob was the primary development tool for this entire project:

1. **Architecture Design** — Bob designed the full-stack architecture (React + Express + Prisma + PostgreSQL) and the service/route separation pattern
2. **Backend Development** — Bob wrote all 8 services, 12 route files, Prisma schema (20 models), and comprehensive seed data
3. **Frontend Development** — Bob built all 11 pages, the 3D globe component, AI Copilot, Simulation Lab, and the complete Tailwind design system
4. **AI Engine** — Bob designed the watsonx abstraction layer with local fallback, the intent recognition system, and the explainable risk engine
5. **Data Design** — Bob created the realistic mock dataset with internally consistent relationships (30 shipments, 8 disruptions, 15 fleet assets, 100+ sensor readings)
6. **Documentation** — Bob wrote this README and AGENTS.md

Bob's **Agent mode** was used throughout — writing files, running builds, fixing errors, and verifying the application at each phase.

---

## Hackathon Value Proposition

CHAINguard AI demonstrates:

- **Real AI-powered decision support** — not a static dashboard but a live reasoning engine
- **Full-stack working application** — database → APIs → business logic → frontend → 3D visualization
- **Explainability** — every risk score, recommendation, and AI answer cites the actual data behind it
- **IBM-ready architecture** — watsonx.ai integration point built in from day one
- **Production patterns** — Prisma ORM, WebSocket real-time, error handling, loading states, responsive design

*Built entirely with IBM Bob in one hackathon day.*
