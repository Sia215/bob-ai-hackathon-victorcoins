/**
 * aiService.js
 * AI abstraction layer.
 * Attempts watsonx.ai if credentials are configured, otherwise uses the
 * local reasoning engine which operates purely on the database.
 */
import prisma from '../lib/prisma.js'

// ─── Intent detection ────────────────────────────────────────────────────────

const INTENTS = [
  // Specific shipment risk explanation — must be before shipment_detail to take priority
  { name: 'explain_risk',           patterns: [/why.+risk/i, /explain.+risk/i, /risk.+reason/i, /why.+high.risk/i, /why.+critical/i, /risk.+score/i, /what.+makes.+shp/i] },
  // Specific shipment lookup
  { name: 'shipment_detail',        patterns: [/\bshp-?\d+\b/i, /shipment.+detail/i, /tell me about.+shipment/i, /info.+shp/i, /status of shp/i] },
  // Disruption-affected shipments
  { name: 'disruption_affected',    patterns: [/disruption/i, /affected.+shipment/i, /shipment.+affected/i, /strike/i, /flood/i, /storm/i, /closure/i, /earthquake/i, /geopolit/i, /blockade/i] },
  // Highest risk
  { name: 'highest_risk_shipments', patterns: [/highest.risk/i, /most at.risk/i, /critical shipment/i, /top risk/i, /riskiest/i, /most danger/i, /worst shipment/i] },
  // Idle fleet
  { name: 'idle_fleet',             patterns: [/idle.+asset/i, /idle.+fleet/i, /fleet.+idle/i, /unused.+vehicle/i, /available.+truck/i, /stranded/i, /redeploy/i, /which.+truck/i] },
  // Cold chain
  { name: 'cold_chain_alerts',      patterns: [/cold.chain/i, /temperature/i, /excursion/i, /sensor/i, /refrigerat/i, /reefer/i, /thermal/i, /temp.+(problem|issue|alert)/i] },
  // Today's priorities
  { name: 'prioritize_today',       patterns: [/priorit/i, /today.+action/i, /what.+do.+today/i, /urgent/i, /immediate/i, /focus/i, /what should we/i, /action plan/i] },
  // What-if simulation
  { name: 'what_if_scenario',       patterns: [/what.+if/i, /scenario/i, /simulat/i, /hypothetical/i, /if.+disruption/i, /impact of/i] },
  // Cargo value
  { name: 'cargo_value_at_risk',    patterns: [/cargo.+value/i, /value.+at.risk/i, /financial.+risk/i, /money.+risk/i, /₹.+risk/i, /rupee.+risk/i, /total.+risk/i] },
  // Fleet summary
  { name: 'fleet_summary',          patterns: [/fleet.+status/i, /fleet.+summary/i, /how.+many.+truck/i, /vessel.+status/i, /asset.+status/i, /fleet.+overview/i] },
  // Recommendations
  { name: 'recommendations',        patterns: [/recommend/i, /suggest/i, /action.+item/i, /what.+should/i, /pending.+action/i] },
  // Delayed shipments
  { name: 'delayed_shipments',      patterns: [/delay/i, /late/i, /behind.+schedule/i, /overdue/i] },
]

function detectIntent(message) {
  for (const intent of INTENTS) {
    if (intent.patterns.some((p) => p.test(message))) return intent.name
  }
  return 'general'
}

// ─── Local reasoning handlers ─────────────────────────────────────────────────

async function handleHighestRiskShipments() {
  const risks = await prisma.riskAssessment.findMany({
    orderBy: { score: 'desc' },
    take: 5,
    include: { shipment: { include: { carrier: true } } },
  })
  const lines = risks.map(
    (r, i) =>
      `${i + 1}. **${r.shipment.shipmentCode}** (${r.shipment.origin} → ${r.shipment.destination}) — Risk: **${r.level}** (${r.score}/100)\n   ${r.explanation}`
  )
  return {
    response: `## Top 5 Highest-Risk Shipments\n\n${lines.join('\n\n')}`,
    citations: risks.map((r) => ({ type: 'SHIPMENT', id: r.shipment.id, code: r.shipment.shipmentCode })),
    actions: risks
      .filter((r) => r.level === 'CRITICAL')
      .map((r) => ({ type: 'VIEW_SHIPMENT', shipmentId: r.shipment.id, label: `Review ${r.shipment.shipmentCode}` })),
  }
}

async function handleExplainRisk(message) {
  // Match SHP-001, SHP-01, SHP-1, shp001 etc.
  const raw = message.match(/shp-?\s*(\d+)/i)
  if (!raw) {
    return { response: 'Please specify a shipment code, e.g. "Why is SHP-007 high risk?" or "Explain risk for SHP-012".', citations: [], actions: [] }
  }
  const code = `SHP-${raw[1].padStart(3, '0')}`
  const shipment = await prisma.shipment.findUnique({
    where: { shipmentCode: code },
    include: {
      carrier: true,
      riskAssessments: { orderBy: { calculatedAt: 'desc' }, take: 1 },
      affectedDisruptions: { include: { disruption: true } },
      coldChainAlerts: { where: { resolvedAt: null } },
    },
  })
  if (!shipment) {
    return { response: `Shipment ${code} not found in the system.`, citations: [], actions: [] }
  }
  const risk = shipment.riskAssessments[0]
  if (!risk) {
    return { response: `No risk assessment found for ${code}. The risk engine may not have run yet.`, citations: [], actions: [] }
  }
  const disruptions = shipment.affectedDisruptions.map(ad => ad.disruption)
  const factors = [
    `| Factor | Score | Details |`,
    `|--------|-------|---------|`,
    `| Disruption | ${risk.disruptionScore}/30 | ${disruptions.length} disruption(s): ${disruptions.map(d => d.name).join(', ') || 'none'} |`,
    `| Delay | ${risk.delayScore}/20 | ${shipment.delayHours}h delay recorded |`,
    `| Priority | ${risk.priorityScore}/20 | Shipment priority: ${shipment.priority} |`,
    `| Route | ${risk.routeScore}/15 | Origin: ${shipment.origin} → ${shipment.destination} |`,
    `| Cold Chain | ${risk.coldChainScore}/15 | ${shipment.isColdChain ? 'Cold chain active' : 'Not cold chain'} |`,
    `| Carrier | ${risk.carrierScore}/10 | ${shipment.carrier.name} reliability: ${(shipment.carrier.reliabilityScore * 100).toFixed(0)}% |`,
    `| **Total** | **${Math.round(risk.score)}/100** | **${risk.level}** |`,
  ].join('\n')
  return {
    response: [
      `## Risk Explanation: ${code}`,
      `**Overall Risk: ${risk.level} (${Math.round(risk.score)}/100)**`,
      ``,
      `> ${risk.explanation}`,
      ``,
      `### Factor Breakdown`,
      factors,
      ``,
      shipment.coldChainAlerts.length > 0
        ? `⚠ **Active cold-chain alerts:** ${shipment.coldChainAlerts.map(a => a.description).join('; ')}`
        : '',
    ].filter(Boolean).join('\n'),
    citations: [{ type: 'SHIPMENT', id: shipment.id, code: shipment.shipmentCode }],
    actions: [{ type: 'VIEW_SHIPMENT', shipmentId: shipment.id, label: `Open ${code}` }],
  }
}

async function handleShipmentDetail(message) {
  const raw = message.match(/shp-?\s*(\d+)/i)
  let shipment = null
  if (raw) {
    const code = `SHP-${raw[1].padStart(3, '0')}`
    shipment = await prisma.shipment.findUnique({
      where: { shipmentCode: code },
      include: {
        carrier: true,
        riskAssessments: { orderBy: { calculatedAt: 'desc' }, take: 1 },
        affectedDisruptions: { include: { disruption: true } },
        coldChainAlerts: { where: { resolvedAt: null } },
      },
    })
  }
  if (!shipment) {
    return { response: 'Please specify a valid shipment code (e.g., SHP-001) for details.', citations: [], actions: [] }
  }
  const risk = shipment.riskAssessments[0]
  const alerts = shipment.coldChainAlerts
  const disruptions = shipment.affectedDisruptions.map(ad => ad.disruption)
  const response = [
    `## ${shipment.shipmentCode} — ${shipment.origin} → ${shipment.destination}`,
    `- **Status:** ${shipment.status}  |  **Priority:** ${shipment.priority}`,
    `- **Cargo:** ${shipment.cargoType}  |  **Value:** ₹${shipment.value}L  |  **Weight:** ${shipment.weight}kg`,
    `- **Carrier:** ${shipment.carrier.name} (${(shipment.carrier.reliabilityScore * 100).toFixed(0)}% reliable)`,
    `- **Delay:** ${shipment.delayHours > 0 ? `+${shipment.delayHours}h` : 'On time'}  |  **Cold Chain:** ${shipment.isColdChain ? 'Yes' : 'No'}`,
    `- **ETA:** ${shipment.estimatedArrival ? new Date(shipment.estimatedArrival).toLocaleDateString() : 'Unknown'}`,
    disruptions.length > 0 ? `- **Active Disruptions:** ${disruptions.map(d => `${d.name} (${d.severity})`).join(', ')}` : '',
    risk ? `- **Risk Score:** ${Math.round(risk.score)}/100 (${risk.level}) — ${risk.explanation}` : '- Risk assessment pending',
    alerts.length > 0 ? `- **⚠ Cold-chain Alerts:** ${alerts.map((a) => a.description).join('; ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  return {
    response,
    citations: [{ type: 'SHIPMENT', id: shipment.id, code: shipment.shipmentCode }],
    actions: [{ type: 'VIEW_SHIPMENT', shipmentId: shipment.id, label: `Open ${shipment.shipmentCode}` }],
  }
}

async function handleDisruptionAffected() {
  const disruptions = await prisma.disruption.findMany({
    where: { status: { in: ['ACTIVE', 'MONITORING'] } },
    include: { affectedShipments: { include: { shipment: { select: { shipmentCode: true, origin: true, destination: true, priority: true } } } } },
    orderBy: { severity: 'desc' },
  })
  const lines = disruptions.map(
    (d) =>
      `### ${d.name} (${d.severity})\n${d.description}\n**Affected:** ${d.affectedShipments.map((as) => as.shipment.shipmentCode).join(', ') || 'None tracked'}`
  )
  return {
    response: `## Active Disruptions & Affected Shipments\n\n${lines.join('\n\n')}`,
    citations: disruptions.map((d) => ({ type: 'DISRUPTION', id: d.id, name: d.name })),
    actions: [],
  }
}

async function handleIdleFleet() {
  const assets = await prisma.fleetAsset.findMany({
    where: { status: { in: ['IDLE', 'STRANDED'] } },
    include: { carrier: true },
  })
  if (assets.length === 0) {
    return { response: 'No idle or stranded assets found currently.', citations: [], actions: [] }
  }
  const lines = assets.map(
    (a) => `- **${a.assetCode}** (${a.assetType}/${a.subtype ?? 'N/A'}) at ${a.currentLocation} — Status: ${a.status}, Carrier: ${a.carrier?.name ?? 'Unknown'}`
  )
  return {
    response: `## Idle & Stranded Fleet Assets (${assets.length})\n\n${lines.join('\n')}`,
    citations: assets.map((a) => ({ type: 'FLEET', id: a.id, code: a.assetCode })),
    actions: assets
      .filter((a) => a.status === 'IDLE')
      .slice(0, 3)
      .map((a) => ({ type: 'REDEPLOY_ASSET', assetId: a.id, label: `Redeploy ${a.assetCode}` })),
  }
}

async function handleColdChainAlerts() {
  const alerts = await prisma.coldChainAlert.findMany({
    where: { resolvedAt: null },
    include: { shipment: { select: { shipmentCode: true, origin: true, destination: true, cargoType: true } } },
    orderBy: { createdAt: 'desc' },
  })
  if (alerts.length === 0) {
    return { response: 'No active cold-chain alerts at this time. All monitored shipments are within temperature bounds.', citations: [], actions: [] }
  }
  const lines = alerts.map(
    (a) =>
      `- **${a.shipment.shipmentCode}** (${a.shipment.cargoType}): ${a.alertType} — ${a.description} [${a.severity}]`
  )
  return {
    response: `## Active Cold-Chain Alerts (${alerts.length})\n\n${lines.join('\n')}\n\n> Immediate inspection recommended for CRITICAL alerts.`,
    citations: alerts.map((a) => ({ type: 'SHIPMENT', id: a.shipmentId, code: a.shipment.shipmentCode })),
    actions: alerts
      .filter((a) => a.severity === 'CRITICAL')
      .map((a) => ({ type: 'INSPECT_SHIPMENT', shipmentId: a.shipmentId, label: `Inspect ${a.shipment.shipmentCode}` })),
  }
}

async function handlePrioritizeToday() {
  const [criticalShipments, coldAlerts, disruptions] = await Promise.all([
    prisma.riskAssessment.findMany({
      where: { level: { in: ['CRITICAL', 'HIGH'] } },
      orderBy: { score: 'desc' },
      take: 5,
      include: { shipment: { select: { shipmentCode: true, origin: true, destination: true, status: true } } },
    }),
    prisma.coldChainAlert.count({ where: { resolvedAt: null, severity: 'CRITICAL' } }),
    prisma.disruption.count({ where: { status: 'ACTIVE', severity: { in: ['CRITICAL', 'HIGH'] } } }),
  ])
  const items = criticalShipments.map(
    (r, i) => `${i + 1}. **${r.shipment.shipmentCode}** — ${r.level} risk (${r.score}/100) — ${r.shipment.status}`
  )
  return {
    response: [
      `## Today's Priority Actions`,
      `**Critical cold-chain breaches:** ${coldAlerts}`,
      `**High/Critical disruptions active:** ${disruptions}`,
      ``,
      `### Top Shipments Requiring Attention:`,
      items.join('\n'),
      ``,
      `_Review recommendations panel for specific action items._`,
    ].join('\n'),
    citations: criticalShipments.map((r) => ({ type: 'SHIPMENT', id: r.shipmentId, code: r.shipment.shipmentCode })),
    actions: [{ type: 'VIEW_RECOMMENDATIONS', label: 'Open Recommendations' }],
  }
}

async function handleCargoValueAtRisk() {
  const risks = await prisma.riskAssessment.findMany({
    where: { level: { in: ['HIGH', 'CRITICAL'] } },
    include: { shipment: { select: { value: true, shipmentCode: true, cargoType: true } } },
  })
  const total = risks.reduce((s, r) => s + r.shipment.value, 0)
  const critical = risks.filter((r) => r.level === 'CRITICAL').reduce((s, r) => s + r.shipment.value, 0)
  const breakdown = risks
    .sort((a, b) => b.shipment.value - a.shipment.value)
    .slice(0, 5)
    .map((r) => `- **${r.shipment.shipmentCode}** (${r.shipment.cargoType}): ₹${r.shipment.value}L — ${r.level}`)
  return {
    response: [
      `## Cargo Value at Risk`,
      `**Total HIGH/CRITICAL cargo at risk:** ₹${total.toFixed(1)}L`,
      `**Critical only:** ₹${critical.toFixed(1)}L`,
      ``,
      `### Top 5 by value:`,
      breakdown.join('\n'),
    ].join('\n'),
    citations: risks.map((r) => ({ type: 'SHIPMENT', id: r.shipmentId, code: r.shipment.shipmentCode })),
    actions: [],
  }
}

async function handleFleetSummary() {
  const assets = await prisma.fleetAsset.groupBy({
    by: ['status'],
    _count: { status: true },
  })
  const summary = Object.fromEntries(assets.map((a) => [a.status, a._count.status]))
  const lines = Object.entries(summary).map(([status, count]) => `- **${status}:** ${count}`)
  return {
    response: `## Fleet Status Summary\n\n${lines.join('\n')}`,
    citations: [],
    actions: [{ type: 'VIEW_FLEET', label: 'Open Fleet Dashboard' }],
  }
}

async function handleRecommendations() {
  const recs = await prisma.recommendation.findMany({
    where: { status: 'PENDING' },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    take: 6,
    include: { shipment: { select: { shipmentCode: true } } },
  })
  const lines = recs.map(
    (r) => `- **[${r.priority}]** ${r.title} — ${r.estimatedImpact}`
  )
  return {
    response: `## Pending Recommendations (${recs.length})\n\n${lines.join('\n')}`,
    citations: [],
    actions: [{ type: 'VIEW_RECOMMENDATIONS', label: 'Open All Recommendations' }],
  }
}

async function handleWhatIf(message) {
  return {
    response: `To run a what-if simulation, use the Simulation panel. You can adjust:\n- Disruption severity multiplier\n- Duration extension (hours)\n- Affected radius (km)\n\nThe engine will recalculate all risk scores and show baseline vs simulated impact on cargo value, cold-chain alerts, and fleet utilisation.`,
    citations: [],
    actions: [{ type: 'OPEN_SIMULATION', label: 'Open Simulation Panel' }],
  }
}

async function handleDelayedShipments() {
  const shipments = await prisma.shipment.findMany({
    where: { delayHours: { gt: 0 } },
    orderBy: { delayHours: 'desc' },
    take: 10,
    include: {
      carrier: true,
      riskAssessments: { orderBy: { calculatedAt: 'desc' }, take: 1 },
    },
  })
  if (shipments.length === 0) {
    return { response: 'No delayed shipments detected. All shipments are currently on schedule.', citations: [], actions: [] }
  }
  const lines = shipments.map(
    (s, i) => `${i + 1}. **${s.shipmentCode}** — +${s.delayHours}h delay | ${s.origin} → ${s.destination} | Carrier: ${s.carrier.name} | Risk: ${s.riskAssessments[0]?.level ?? 'UNKNOWN'}`
  )
  return {
    response: `## Delayed Shipments (${shipments.length})\n\n${lines.join('\n')}`,
    citations: shipments.map(s => ({ type: 'SHIPMENT', id: s.id, code: s.shipmentCode })),
    actions: [],
  }
}

async function handleGeneral(message) {
  return {
    response: [
      `I'm CHAINguard AI — your supply chain intelligence assistant. I can answer questions like:`,
      ``,
      `- **"Show top risk shipments"** — highest risk shipments right now`,
      `- **"Why is SHP-007 high risk?"** — detailed factor-by-factor risk explanation`,
      `- **"Tell me about SHP-012"** — full shipment status, carrier, delays, alerts`,
      `- **"Which shipments are affected by the flood?"** — disruption impact analysis`,
      `- **"Which idle trucks can be redeployed?"** — idle/stranded fleet assets`,
      `- **"Any cold-chain alerts?"** — temperature excursions across monitored shipments`,
      `- **"What should we prioritize today?"** — today's top action items`,
      `- **"What are the delayed shipments?"** — all shipments running behind schedule`,
      `- **"What's the cargo value at risk?"** — financial exposure from high-risk shipments`,
      `- **"What are pending recommendations?"** — active AI recommendation queue`,
      ``,
      `What would you like to know?`,
    ].join('\n'),
    citations: [],
    actions: [],
  }
}

// ─── Local reasoning engine ──────────────────────────────────────────────────

async function localReasoning(message, context) {
  const intent = detectIntent(message)
  switch (intent) {
    case 'explain_risk':           return handleExplainRisk(message)
    case 'highest_risk_shipments': return handleHighestRiskShipments()
    case 'shipment_detail':        return handleShipmentDetail(message)
    case 'disruption_affected':    return handleDisruptionAffected()
    case 'idle_fleet':             return handleIdleFleet()
    case 'cold_chain_alerts':      return handleColdChainAlerts()
    case 'prioritize_today':       return handlePrioritizeToday()
    case 'what_if_scenario':       return handleWhatIf(message)
    case 'cargo_value_at_risk':    return handleCargoValueAtRisk()
    case 'fleet_summary':          return handleFleetSummary()
    case 'recommendations':        return handleRecommendations()
    case 'delayed_shipments':      return handleDelayedShipments()
    default:                       return handleGeneral(message)
  }
}

// ─── watsonx.ai integration ──────────────────────────────────────────────────

async function queryWatsonx(message, context) {
  const { WATSONX_API_KEY, WATSONX_URL, WATSONX_PROJECT_ID } = process.env
  const endpoint = `${WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`

  // Build context summary for the LLM
  const systemPrompt = `You are CHAINguard AI, an intelligent supply chain management assistant for an Indian logistics company. You have access to real-time data about shipments, disruptions, fleet assets, and cold-chain monitoring. Be concise, data-driven, and action-oriented. Always cite specific shipment codes or disruption names from the context provided.`

  const contextStr = context
    ? `Current operational context:\n${JSON.stringify(context, null, 2)}`
    : ''

  const body = {
    model_id: 'ibm/granite-13b-instruct-v2',
    project_id: WATSONX_PROJECT_ID,
    input: `${systemPrompt}\n\n${contextStr}\n\nUser: ${message}\nAssistant:`,
    parameters: {
      decoding_method: 'greedy',
      max_new_tokens: 500,
      stop_sequences: ['\nUser:'],
    },
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WATSONX_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`watsonx API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const text = data?.results?.[0]?.generated_text ?? ''
  return { response: text.trim(), citations: [], actions: [], source: 'watsonx' }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main AI query function.
 * Tries watsonx if credentials are present, falls back to local reasoning.
 *
 * @param {string} message        - User's question
 * @param {object|null} context   - Optional additional context object
 * @returns {{ response, citations, actions, source }}
 */
export async function queryAI(message, context = null) {
  const { WATSONX_API_KEY, WATSONX_URL, WATSONX_PROJECT_ID } = process.env
  const hasWatsonx = WATSONX_API_KEY && WATSONX_URL && WATSONX_PROJECT_ID

  if (hasWatsonx) {
    try {
      const result = await queryWatsonx(message, context)
      return { ...result, source: 'watsonx' }
    } catch (err) {
      console.warn('[aiService] watsonx failed, falling back to local reasoning:', err.message)
    }
  }

  const result = await localReasoning(message, context)
  return { ...result, source: 'local' }
}

/**
 * Save a message to an existing or new conversation.
 */
export async function saveMessage({ conversationId, role, content, dataContext }) {
  let convoId = conversationId
  if (!convoId) {
    const convo = await prisma.aiConversation.create({ data: { title: content.slice(0, 60) } })
    convoId = convo.id
  }
  const msg = await prisma.aiMessage.create({
    data: {
      conversationId: convoId,
      role,
      content,
      dataContext: dataContext ? JSON.stringify(dataContext) : null,
    },
  })
  return { conversationId: convoId, message: msg }
}
