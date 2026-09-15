import { disruptions } from '../data/disruptions';

// Alternative carrier pool
const alternativeCarriers = {
  'Pacific Freight Co.': ['KorAm Pacific', 'AsiaPac Logistics', 'SinoEuro Lines'],
  'IndoEuro Shipping': ['Gulf Cargo Lines', 'PakEuro Lines', 'MedExpress'],
  'IndoAfrica Freight': ['AfroGulf Express', 'AfroEuro Cargo', 'Gulf Cargo Lines'],
  'Gulf Cargo Lines': ['IndoEuro Shipping', 'PakEuro Lines', 'MedExpress'],
  'SinoEuro Lines': ['Pacific Freight Co.', 'KorAm Pacific', 'Atlantic Express'],
  'BritIndia Shipping': ['IndoEuro Shipping', 'PakEuro Lines', 'MedExpress'],
  'PakEuro Lines': ['IndoEuro Shipping', 'Gulf Cargo Lines', 'MedExpress'],
  'NorthAm Ground': ['SouthAm Cargo', 'EuroLand Freight', 'Air Freight Express'],
  'Trans-Siberian Rail': ['SinoEuro Lines', 'Air Freight Express', 'EuroLand Freight'],
  'KorAm Pacific': ['Pacific Freight Co.', 'AsiaPac Logistics'],
  'AsiaPac Logistics': ['KorAm Pacific', 'Pacific Freight Co.'],
  'AfroEuro Cargo': ['AfroGulf Express', 'IndoAfrica Freight'],
  'IndoLanka Express': ['Gulf Cargo Lines', 'IndoEuro Shipping'],
};

// Alternative route strategies
const routeStrategies = {
  D001: {
    strategy: 'Northern Pacific deviation',
    reason: 'Typhoon Mawar blocks standard Pacific lanes. Reroute via northern arc (closer to Aleutian Islands) to avoid storm centre.',
  },
  D002: {
    strategy: 'Reroute via Nhava Sheva + Air Freight for urgent cargo',
    reason: 'Mumbai port strike. Use alternative Indian ports (Chennai, Mundra) or upgrade to air freight for critical/pharmaceutical shipments.',
  },
  D003: {
    strategy: 'Cape of Good Hope reroute',
    reason: 'Red Sea corridor is unsafe. Reroute around Cape of Good Hope — adds ~12 days but ensures cargo safety.',
  },
  D004: {
    strategy: 'Southern European rail corridor',
    reason: 'Russia-EU border restrictions. Use southern overland route via Central Asia or upgrade to air freight.',
  },
  D005: {
    strategy: 'Alternate border crossing (Otay Mesa or Eagle Pass)',
    reason: 'Laredo and El Paso congested. Route cargo via Otay Mesa (San Diego) or Eagle Pass for faster clearance.',
  },
};

/**
 * Generate a recommendation for an affected shipment.
 */
export function getRecommendation(shipment, riskLevel) {
  const affectedDisruptionIds = shipment.affectedDisruptions || [];
  if (affectedDisruptionIds.length === 0) {
    return { action: 'No Action Required', details: 'Shipment is on track with no active disruptions.' };
  }

  // Pick highest-severity disruption for primary recommendation
  const allDisruptions = affectedDisruptionIds.map((id) =>
    disruptions.find((d) => d.id === id)
  ).filter(Boolean);

  const severityOrder = ['Critical', 'High', 'Medium', 'Low'];
  allDisruptions.sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );
  const primaryDisruption = allDisruptions[0];
  const strategy = routeStrategies[primaryDisruption.id] || {
    strategy: 'Review routing with carrier',
    reason: 'Active disruption detected. Contact carrier for updated routing.',
  };

  const alternatives = alternativeCarriers[shipment.carrier] || ['Air Freight Express'];
  const altCarrier = alternatives[0];

  let action;
  if (riskLevel === 'Critical') {
    action = 'Immediate Reroute + Carrier Switch';
  } else if (riskLevel === 'High') {
    action = 'Priority Reroute';
  } else {
    action = 'Monitor & Prepare Contingency';
  }

  return {
    action,
    alternativeRoute: strategy.strategy,
    alternativeCarrier: altCarrier,
    reason: strategy.reason,
    affectedBy: primaryDisruption.title,
    priorityHandling: riskLevel === 'Critical' || shipment.priority === 'Critical',
  };
}
