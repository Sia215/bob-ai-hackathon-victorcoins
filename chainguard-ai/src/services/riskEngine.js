import { disruptions } from '../data/disruptions';

/**
 * Calculate a risk score (0–100) for a shipment.
 * Returns { score, level, factors } for full explainability.
 */
export function calculateRisk(shipment, coldChainReadings = []) {
  let score = 0;
  const factors = [];

  // 1. Disruption severity (0–40 pts)
  if (shipment.affectedDisruptions && shipment.affectedDisruptions.length > 0) {
    const severityMap = { Critical: 40, High: 28, Medium: 18, Low: 8 };
    let maxSeverityScore = 0;
    let maxSeverityLabel = '';
    shipment.affectedDisruptions.forEach((dId) => {
      const d = disruptions.find((x) => x.id === dId);
      if (d) {
        const s = severityMap[d.severity] || 10;
        if (s > maxSeverityScore) {
          maxSeverityScore = s;
          maxSeverityLabel = d.severity;
        }
      }
    });
    score += maxSeverityScore;
    if (maxSeverityScore > 0) {
      factors.push(`Disruption severity: ${maxSeverityLabel} (+${maxSeverityScore} pts)`);
    }
  }

  // 2. Shipment priority (0–25 pts)
  const priorityMap = { Critical: 25, High: 18, Medium: 10, Low: 4 };
  const priorityScore = priorityMap[shipment.priority] || 5;
  score += priorityScore;
  factors.push(`Shipment priority: ${shipment.priority} (+${priorityScore} pts)`);

  // 3. Delay status (0–20 pts)
  const delayDays = shipment.delayDays || 0;
  let delayScore = 0;
  if (delayDays >= 7) delayScore = 20;
  else if (delayDays >= 4) delayScore = 14;
  else if (delayDays >= 1) delayScore = 8;
  if (delayScore > 0) {
    score += delayScore;
    factors.push(`Delay: ${delayDays} day(s) (+${delayScore} pts)`);
  }

  // 4. Status modifier (0–10 pts)
  const statusMap = { Delayed: 10, 'At Risk': 8, 'In Transit': 2, 'On Time': 0 };
  const statusScore = statusMap[shipment.status] || 0;
  if (statusScore > 0) {
    score += statusScore;
    factors.push(`Status: ${shipment.status} (+${statusScore} pts)`);
  }

  // 5. Cold-chain risk (0–10 pts)
  const ccRecord = coldChainReadings.find((r) => r.shipmentId === shipment.id);
  if (ccRecord) {
    const coldMap = { Critical: 10, Warning: 5, Normal: 0 };
    const coldScore = coldMap[ccRecord.severity] || 0;
    if (coldScore > 0) {
      score += coldScore;
      factors.push(`Cold-chain excursion: ${ccRecord.severity} (+${coldScore} pts)`);
    }
  }

  // Cap at 100
  score = Math.min(100, score);

  let level;
  if (score >= 75) level = 'Critical';
  else if (score >= 50) level = 'High';
  else if (score >= 25) level = 'Medium';
  else level = 'Low';

  return { score, level, factors };
}

/**
 * Enrich all shipments with their risk data.
 */
export function enrichShipmentsWithRisk(shipments, coldChainReadings = []) {
  return shipments.map((s) => {
    const risk = calculateRisk(s, coldChainReadings);
    return { ...s, riskScore: risk.score, riskLevel: risk.level, riskFactors: risk.factors };
  });
}
