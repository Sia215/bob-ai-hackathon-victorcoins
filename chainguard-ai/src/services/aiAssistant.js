import { disruptions } from '../data/disruptions';
import { fleetAssets } from '../data/fleet';

/**
 * Rule-based AI Logistics Assistant.
 * Answers questions using the actual application data.
 * Never invents shipment IDs, disruptions, fleet assets, or sensor values.
 */

function matchesAny(text, patterns) {
  return patterns.some((p) => text.toLowerCase().includes(p.toLowerCase()));
}

export function generateResponse(userMessage, enrichedShipments, coldChainReadings) {
  const msg = userMessage.toLowerCase().trim();

  // ---- Highest risk shipments ----
  if (matchesAny(msg, ['highest risk', 'most at risk', 'riskiest', 'top risk', 'worst risk'])) {
    const topShipments = [...enrichedShipments]
      .filter((s) => s.riskLevel === 'Critical' || s.riskLevel === 'High')
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);

    if (topShipments.length === 0) {
      return 'No high-risk shipments are currently detected. All shipments are within acceptable risk thresholds.';
    }

    const list = topShipments
      .map(
        (s, i) =>
          `${i + 1}. **${s.id}** — ${s.origin} → ${s.destination} | Risk: **${s.riskLevel}** (${s.riskScore}/100) | Status: ${s.status} | Carrier: ${s.carrier}`
      )
      .join('\n');
    return `The **${topShipments.length} highest-risk shipments** right now are:\n\n${list}\n\nThese shipments require immediate attention due to active disruptions, delays, or cold-chain issues.`;
  }

  // ---- Disruption-specific shipments ----
  if (matchesAny(msg, ['mumbai', 'port strike', 'd002'])) {
    const d = disruptions.find((x) => x.id === 'D002');
    const affected = enrichedShipments.filter((s) => s.affectedDisruptions.includes('D002'));
    if (affected.length === 0) return 'No shipments are currently affected by the Mumbai port strike.';
    const list = affected
      .map((s) => `• **${s.id}** — ${s.origin} → ${s.destination} | ${s.cargoType} | Risk: ${s.riskLevel} | Status: ${s.status}`)
      .join('\n');
    return `**${d.title}** (${d.severity} severity) is affecting **${affected.length} shipment(s)**:\n\n${list}\n\n**Recommendation:** ${affected.some(s => s.cargoType === 'Pharmaceuticals') ? 'Pharmaceutical cargo should be urgently rerouted via Chennai or Mundra port, or upgraded to air freight.' : 'Consider rerouting via alternative Indian ports (Chennai, Mundra).'}`;
  }

  if (matchesAny(msg, ['typhoon', 'pacific', 'mawar', 'd001'])) {
    const d = disruptions.find((x) => x.id === 'D001');
    const affected = enrichedShipments.filter((s) => s.affectedDisruptions.includes('D001'));
    if (affected.length === 0) return 'No shipments are currently affected by Pacific Typhoon Mawar.';
    const list = affected
      .map((s) => `• **${s.id}** — ${s.origin} → ${s.destination} | Risk: ${s.riskLevel} | Delay: ${s.delayDays}d`)
      .join('\n');
    return `**${d.title}** is affecting **${affected.length} shipment(s)**:\n\n${list}\n\n**Recommendation:** Reroute via northern Pacific arc. Expect 2–4 additional days.`;
  }

  if (matchesAny(msg, ['red sea', 'suez', 'geopolitical', 'd003'])) {
    const d = disruptions.find((x) => x.id === 'D003');
    const affected = enrichedShipments.filter((s) => s.affectedDisruptions.includes('D003'));
    if (affected.length === 0) return 'No shipments are currently affected by Red Sea tensions.';
    const list = affected
      .map((s) => `• **${s.id}** — ${s.origin} → ${s.destination} | Risk: ${s.riskLevel}`)
      .join('\n');
    return `**${d.title}** is affecting **${affected.length} shipment(s)**:\n\n${list}\n\n**Recommendation:** Reroute via Cape of Good Hope. This adds approximately 12 days but ensures cargo safety.`;
  }

  if (matchesAny(msg, ['border', 'mexico', 'us-mexico', 'd005'])) {
    const d = disruptions.find((x) => x.id === 'D005');
    const affected = enrichedShipments.filter((s) => s.affectedDisruptions.includes('D005'));
    if (affected.length === 0) return 'No shipments are currently affected by US-Mexico border congestion.';
    const list = affected
      .map((s) => `• **${s.id}** — ${s.origin} → ${s.destination} | Risk: ${s.riskLevel}`)
      .join('\n');
    return `**${d.title}** is affecting **${affected.length} shipment(s)**:\n\n${list}\n\n**Recommendation:** Route via Otay Mesa (San Diego) or Eagle Pass for faster customs clearance.`;
  }

  // ---- Idle fleet / redeployment ----
  if (matchesAny(msg, ['idle', 'redeploy', 'redeployment', 'available truck', 'available vehicle', 'available fleet', 'fleet asset', 'idle truck'])) {
    const idle = fleetAssets.filter((v) => v.status === 'Idle');
    if (idle.length === 0) return 'No fleet assets are currently idle. All vehicles are in use or under maintenance.';
    const list = idle
      .map((v) => `• **${v.id}** — ${v.type} (${v.subtype}) | Location: ${v.currentLocation} | Capacity: ${v.capacity} | Fuel: ${v.fuelLevel}%`)
      .join('\n');
    return `**${idle.length} idle fleet asset(s)** available for immediate redeployment:\n\n${list}\n\nThese assets can be dispatched to cover disrupted routes or support delayed shipments.`;
  }

  // ---- Cold-chain problems ----
  if (matchesAny(msg, ['cold', 'temperature', 'cold chain', 'cold-chain', 'reefer', 'excursion', 'vaccine', 'pharma', 'cold storage'])) {
    const alerts = coldChainReadings.filter((r) => r.severity === 'Critical' || r.severity === 'Warning');
    if (alerts.length === 0) return 'All cold-chain shipments are currently within safe temperature ranges.';
    const critical = alerts.filter((r) => r.severity === 'Critical');
    const warning = alerts.filter((r) => r.severity === 'Warning');
    let response = `**${alerts.length} cold-chain alert(s) detected:**\n\n`;
    if (critical.length > 0) {
      response += `🔴 **CRITICAL (${critical.length}):**\n`;
      critical.forEach((r) => {
        response += `• **${r.shipmentId}** (${r.id}) — ${r.product} | Temp: ${r.currentTemp}°C (safe: ${r.minSafeTemp}–${r.maxSafeTemp}°C) | Duration: ${r.excursionDuration}\n`;
      });
      response += '\n';
    }
    if (warning.length > 0) {
      response += `🟡 **WARNING (${warning.length}):**\n`;
      warning.forEach((r) => {
        response += `• **${r.shipmentId}** (${r.id}) — ${r.product} | Temp: ${r.currentTemp}°C (safe: ${r.minSafeTemp}–${r.maxSafeTemp}°C) | Duration: ${r.excursionDuration || 'N/A'}\n`;
      });
    }
    return response.trim();
  }

  // ---- Specific shipment ID query ----
  const shipmentIdMatch = msg.match(/\b(s\d{3})\b/i);
  if (shipmentIdMatch) {
    const sid = shipmentIdMatch[1].toUpperCase();
    const s = enrichedShipments.find((x) => x.id === sid);
    if (!s) return `Shipment **${sid}** was not found in the system.`;

    const dNames = (s.affectedDisruptions || [])
      .map((id) => {
        const d = disruptions.find((x) => x.id === id);
        return d ? `${d.title} (${d.severity})` : id;
      })
      .join(', ') || 'None';

    const ccRecord = coldChainReadings.find((r) => r.shipmentId === sid);
    const ccInfo = ccRecord
      ? `\n**Cold-Chain:** ${ccRecord.product} — ${ccRecord.currentTemp}°C (safe: ${ccRecord.minSafeTemp}–${ccRecord.maxSafeTemp}°C) — **${ccRecord.severity}**`
      : '';

    const factorList = (s.riskFactors || []).map((f) => `  • ${f}`).join('\n');

    return `**Shipment ${s.id}** — ${s.origin} → ${s.destination}\n\n` +
      `**Carrier:** ${s.carrier}\n` +
      `**Status:** ${s.status} | **Priority:** ${s.priority}\n` +
      `**Cargo:** ${s.cargoType}\n` +
      `**Risk Score:** ${s.riskScore}/100 — **${s.riskLevel}**\n` +
      `**Delay:** ${s.delayDays > 0 ? s.delayDays + ' day(s)' : 'None'}\n` +
      `**Active Disruptions:** ${dNames}` +
      ccInfo +
      `\n\n**Risk Factors:**\n${factorList || '  • No significant risk factors'}`;
  }

  // ---- Prioritize today ----
  if (matchesAny(msg, ['prioritize', 'priority today', 'what to do', 'focus today', 'action today', 'today'])) {
    const critical = enrichedShipments.filter((s) => s.riskLevel === 'Critical').slice(0, 3);
    const coldCritical = coldChainReadings.filter((r) => r.severity === 'Critical');
    const idleCount = fleetAssets.filter((v) => v.status === 'Idle').length;

    let response = '**Top priorities for today:**\n\n';
    response += `1. **Immediate Cold-Chain Action:** ${coldCritical.length} critical temperature excursion(s) detected. Shipments ${coldCritical.map(r => r.shipmentId).join(', ')} require urgent intervention.\n\n`;
    if (critical.length > 0) {
      response += `2. **Critical Shipment Rerouting:** ${critical.map(s => s.id).join(', ')} are at critical risk. Initiate carrier coordination and rerouting immediately.\n\n`;
    }
    response += `3. **Fleet Redeployment:** ${idleCount} idle asset(s) can be dispatched to cover disrupted routes.\n\n`;
    response += `4. **Monitor Mumbai Strike:** D002 remains unresolved. Check for updates from IndoEuro Shipping and PakEuro Lines.`;
    return response;
  }

  // ---- List all disruptions ----
  if (matchesAny(msg, ['disruption', 'active disruption', 'all disruption', 'list disruption'])) {
    const list = disruptions
      .map((d) => {
        const count = enrichedShipments.filter((s) => s.affectedDisruptions.includes(d.id)).length;
        return `• **${d.id}** — ${d.title} | Severity: **${d.severity}** | Affects ${count} shipment(s) | Est. resolved: ${d.estimatedResolution}`;
      })
      .join('\n');
    return `**${disruptions.length} active disruption(s) in the system:**\n\n${list}`;
  }

  // ---- Help / greeting ----
  if (matchesAny(msg, ['hello', 'hi', 'hey', 'help', 'what can you', 'capabilities'])) {
    return `Hello! I'm the **ChainGuard AI Logistics Assistant**. I can help you with:\n\n` +
      `• "Which shipments are at highest risk?"\n` +
      `• "Which shipments are affected by the Mumbai flood?"\n` +
      `• "Which idle trucks can be redeployed?"\n` +
      `• "Which cold-chain shipments have temperature problems?"\n` +
      `• "What should we prioritize today?"\n` +
      `• "Why is shipment S001 high risk?"\n` +
      `• "Show me all active disruptions"\n\n` +
      `All answers are based on live application data — no fabrications.`;
  }

  // ---- Fallback ----
  const criticalCount = enrichedShipments.filter((s) => s.riskLevel === 'Critical').length;
  const idleCount = fleetAssets.filter((v) => v.status === 'Idle').length;
  const ccAlerts = coldChainReadings.filter((r) => r.severity === 'Critical' || r.severity === 'Warning').length;

  return `I'm not sure I understood that query. Here's the current system snapshot:\n\n` +
    `• **${criticalCount}** shipment(s) at Critical risk\n` +
    `• **${disruptions.length}** active disruptions\n` +
    `• **${idleCount}** idle fleet asset(s)\n` +
    `• **${ccAlerts}** cold-chain alert(s)\n\n` +
    `Try asking: "Which shipments are at highest risk?" or "What should we prioritize today?"`;
}
