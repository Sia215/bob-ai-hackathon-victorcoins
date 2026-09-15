/**
 * riskService.js
 * 5-factor explainable risk scoring engine.
 */

const RISK_LEVELS = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL' }

/**
 * Map a numeric score to a risk level.
 * 0–39 → LOW, 40–59 → MEDIUM, 60–74 → HIGH, 75–100 → CRITICAL
 */
export function scoreToLevel(score) {
  if (score >= 75) return RISK_LEVELS.CRITICAL
  if (score >= 60) return RISK_LEVELS.HIGH
  if (score >= 40) return RISK_LEVELS.MEDIUM
  return RISK_LEVELS.LOW
}

/**
 * Calculate a risk assessment for a single shipment.
 *
 * @param {object} shipment   - Prisma Shipment record (with carrier relation)
 * @param {Array}  disruptions - Active Disruption records that affect this shipment
 * @param {Array}  coldChainReadings - Recent ColdChainReading records for this shipment
 * @returns {{ score, level, factors, explanation }}
 */
export function calculateRisk(shipment, disruptions = [], coldChainReadings = []) {
  const factors = {}

  // ── Factor 1: Disruption Score (0–30) ──────────────────────────────────
  let disruptionScore = 0
  for (const d of disruptions) {
    const severityWeights = { CRITICAL: 12, HIGH: 8, MEDIUM: 5, LOW: 2 }
    disruptionScore += severityWeights[d.severity] ?? 4
  }
  disruptionScore = Math.min(30, disruptionScore)
  factors.disruption = { score: disruptionScore, count: disruptions.length }

  // ── Factor 2: Delay Score (0–20) ────────────────────────────────────────
  const delayHours = shipment.delayHours ?? 0
  let delayScore = 0
  if (delayHours > 0 && delayHours <= 12) delayScore = 6
  else if (delayHours <= 24) delayScore = 10
  else if (delayHours <= 48) delayScore = 15
  else if (delayHours > 48) delayScore = 20
  factors.delay = { score: delayScore, delayHours }

  // ── Factor 3: Priority Score (0–20) ─────────────────────────────────────
  const priorityWeights = { CRITICAL: 20, HIGH: 15, MEDIUM: 10, LOW: 5 }
  const priorityScore = priorityWeights[shipment.priority] ?? 5
  factors.priority = { score: priorityScore, priority: shipment.priority }

  // ── Factor 4: Route Score (0–15) ────────────────────────────────────────
  // Proxy via origin/destination keywords known to be risky
  const riskyKeywords = ['red sea', 'gulf of aden', 'suez', 'felixstowe', 'rotterdam', 'chennai', 'kolkata', 'jnpt']
  const routeText = `${shipment.origin} ${shipment.destination}`.toLowerCase()
  let routeScore = 0
  for (const kw of riskyKeywords) {
    if (routeText.includes(kw)) { routeScore += 5; break }
  }
  if (shipment.status === 'AT_RISK') routeScore = Math.min(15, routeScore + 8)
  routeScore = Math.min(15, routeScore)
  factors.route = { score: routeScore }

  // ── Factor 5: Cold-Chain Score (0–15) ────────────────────────────────────
  let coldChainScore = 0
  if (shipment.isColdChain) {
    if (coldChainReadings.length === 0) {
      coldChainScore = 8 // no data = risk
    } else {
      const excursions = coldChainReadings.filter(
        (r) => r.temperature > r.safeMaxTemp || r.temperature < r.safeMinTemp
      )
      const excursionRatio = excursions.length / coldChainReadings.length
      if (excursionRatio > 0.3) coldChainScore = 15
      else if (excursionRatio > 0.1) coldChainScore = 10
      else if (excursionRatio > 0) coldChainScore = 6
      else coldChainScore = 0
    }
  }
  factors.coldChain = { score: coldChainScore, isColdChain: shipment.isColdChain }

  // ── Carrier score (0–10, deducted for reliability) ──────────────────────
  const reliability = shipment.carrier?.reliabilityScore ?? 0.9
  const carrierScore = Math.round((1 - reliability) * 40) // 0.9 → 4, 0.85 → 6, 0.7 → 12
  factors.carrier = { score: carrierScore, reliabilityScore: reliability }

  const score = Math.min(
    100,
    disruptionScore + delayScore + priorityScore + routeScore + coldChainScore + carrierScore
  )
  const level = scoreToLevel(score)

  const explanationParts = []
  if (disruptionScore >= 20) explanationParts.push(`${disruptions.length} active disruption(s) heavily impacting route`)
  else if (disruptionScore > 0) explanationParts.push(`${disruptions.length} disruption(s) in vicinity`)
  if (delayScore >= 15) explanationParts.push(`severe delay of ${delayHours}h`)
  else if (delayScore > 0) explanationParts.push(`${delayHours}h delay recorded`)
  if (coldChainScore >= 10) explanationParts.push('cold-chain temperature excursions detected')
  if (carrierScore >= 8) explanationParts.push('carrier reliability below standard')
  if (explanationParts.length === 0) explanationParts.push('no major risk factors identified')

  const explanation = `${level} risk (${score}/100): ${explanationParts.join(', ')}.`

  return {
    score: Math.round(score * 10) / 10,
    level,
    factors,
    explanation,
    disruptionScore,
    delayScore,
    priorityScore,
    routeScore,
    coldChainScore,
    carrierScore,
  }
}

/**
 * Bulk recalculate risk for an array of shipments.
 * Each shipment must have .carrier, .affectedDisruptions[].disruption, .coldChainReadings
 */
export function bulkCalculateRisk(shipments) {
  return shipments.map((s) => {
    const disruptions = (s.affectedDisruptions ?? []).map((ad) => ad.disruption).filter(Boolean)
    const readings = s.coldChainReadings ?? []
    return { shipmentId: s.id, ...calculateRisk(s, disruptions, readings) }
  })
}
