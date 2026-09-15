/**
 * simulationService.js
 * Deterministic "what-if" simulation engine.
 * No external calls — pure calculation over in-memory data.
 */
import { calculateRisk } from './riskService.js'

/**
 * Run a disruption-impact simulation.
 *
 * @param {object} params
 *   - disruptionId        {number}
 *   - severityMultiplier  {number}  1.0 = same, 2.0 = double severity
 *   - durationHours       {number}  additional hours the disruption lasts
 *   - affectedRadiusKm    {number}  new radius (replaces existing)
 * @param {object} baselineData
 *   - disruption          Disruption record
 *   - shipments           Shipment[] with carrier, affectedDisruptions[].disruption, coldChainReadings
 *   - coldChainShipments  Shipment[] that are cold-chain
 * @returns {{ baseline, simulated, delta, recommendations }}
 */
export function runSimulation(params, baselineData) {
  const { severityMultiplier = 1.0, durationHours = 0, affectedRadiusKm } = params
  const { disruption, shipments } = baselineData

  const severityUpgrade = {
    LOW: severityMultiplier >= 1.5 ? 'MEDIUM' : 'LOW',
    MEDIUM: severityMultiplier >= 1.5 ? 'HIGH' : 'MEDIUM',
    HIGH: severityMultiplier >= 1.5 ? 'CRITICAL' : 'HIGH',
    CRITICAL: 'CRITICAL',
  }

  const simulatedSeverity = severityUpgrade[disruption.severity] ?? disruption.severity
  const simulatedRadius = affectedRadiusKm ?? disruption.radiusKm * severityMultiplier
  const simulatedDisruption = { ...disruption, severity: simulatedSeverity, radiusKm: simulatedRadius }

  // Helper: haversine distance km
  const haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  // Which shipments fall within the new radius?
  const newlyAffected = shipments.filter((s) => {
    const distOrigin = haversine(disruption.latitude, disruption.longitude, s.originLat, s.originLng)
    const distDest = haversine(disruption.latitude, disruption.longitude, s.destinationLat, s.destinationLng)
    return distOrigin <= simulatedRadius || distDest <= simulatedRadius
  })

  // Baseline calculations
  const baselineRisks = shipments.map((s) => {
    const disruptions = (s.affectedDisruptions ?? []).map((ad) => ad.disruption).filter(Boolean)
    return { shipment: s, risk: calculateRisk(s, disruptions, s.coldChainReadings ?? []) }
  })

  // Simulated calculations — inject simulated disruption for affected shipments
  const simulatedRisks = shipments.map((s) => {
    const isNowAffected = newlyAffected.some((na) => na.id === s.id)
    const existingDisruptions = (s.affectedDisruptions ?? []).map((ad) => ad.disruption).filter(Boolean)
    const disruptions = isNowAffected
      ? [...existingDisruptions.filter((d) => d.id !== disruption.id), simulatedDisruption]
      : existingDisruptions
    // Apply additional delay from duration extension
    const adjustedShipment = isNowAffected
      ? { ...s, delayHours: s.delayHours + Math.ceil(durationHours / 4) }
      : s
    return { shipment: s, risk: calculateRisk(adjustedShipment, disruptions, s.coldChainReadings ?? []) }
  })

  // Aggregate metrics
  const aggregate = (risks) => {
    const affected = risks.filter((r) => r.risk.score >= 60).length
    const critical = risks.filter((r) => r.risk.level === 'CRITICAL').length
    const totalDelay = risks.reduce((s, r) => s + (r.shipment.delayHours ?? 0), 0)
    const cargoValueAtRisk = risks
      .filter((r) => r.risk.score >= 60)
      .reduce((s, r) => s + r.shipment.value, 0)
    const coldChainAlerts = risks.filter(
      (r) => r.shipment.isColdChain && r.risk.coldChainScore >= 10
    ).length
    const fleetStranded = risks.filter((r) => r.shipment.status === 'AT_RISK').length
    return { affected, critical, totalDelay, cargoValueAtRisk, coldChainAlerts, fleetStranded }
  }

  const baseline = aggregate(baselineRisks)
  const simulated = aggregate(simulatedRisks)

  const delta = {
    affectedShipmentsDelta: simulated.affected - baseline.affected,
    criticalShipmentsDelta: simulated.critical - baseline.critical,
    totalDelayDelta: simulated.totalDelay - baseline.totalDelay,
    cargoValueAtRiskDelta: simulated.cargoValueAtRisk - baseline.cargoValueAtRisk,
    coldChainAlertsDelta: simulated.coldChainAlerts - baseline.coldChainAlerts,
  }

  // Generate recommendations based on delta
  const recommendations = []
  if (delta.affectedShipmentsDelta > 0) {
    recommendations.push({
      type: 'REROUTE',
      title: `Reroute ${delta.affectedShipmentsDelta} newly impacted shipment(s)`,
      priority: simulatedSeverity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      impact: `Avoids estimated ₹${(delta.cargoValueAtRiskDelta).toFixed(1)}L additional cargo at risk`,
    })
  }
  if (delta.coldChainAlertsDelta > 0) {
    recommendations.push({
      type: 'COLD_CHAIN_ALERT',
      title: `Pre-alert cold-chain teams for ${delta.coldChainAlertsDelta} shipment(s)`,
      priority: 'HIGH',
      impact: 'Prevents cold-chain excursions by proactive temperature management',
    })
  }
  if (severityMultiplier >= 1.5) {
    recommendations.push({
      type: 'FLEET_REDEPLOY',
      title: 'Pre-position idle fleet assets away from affected zone',
      priority: 'MEDIUM',
      impact: 'Reduces stranded asset risk by moving idle trucks/vessels to safe hubs',
    })
  }

  return {
    params: {
      disruptionId: disruption.id,
      disruption: disruption.name,
      severityMultiplier,
      durationHours,
      simulatedSeverity,
      simulatedRadiusKm: simulatedRadius,
    },
    baseline: {
      affectedShipments: baseline.affected,
      criticalShipments: baseline.critical,
      cargoValueAtRisk: Math.round(baseline.cargoValueAtRisk * 1e5),
      coldChainAlerts: baseline.coldChainAlerts,
      totalDelayHours: baseline.totalDelay,
    },
    simulated: {
      affectedShipments: simulated.affected,
      criticalShipments: simulated.critical,
      cargoValueAtRisk: Math.round(simulated.cargoValueAtRisk * 1e5),
      coldChainAlerts: simulated.coldChainAlerts,
      totalDelayHours: simulated.totalDelay,
      newlyAffectedShipments: newlyAffected.map((s) => ({
        id: s.id,
        shipmentCode: s.shipmentCode,
        origin: s.origin,
        destination: s.destination,
        priority: s.priority,
        value: s.value,
      })),
    },
    delta,
    recommendations,
  }
}
