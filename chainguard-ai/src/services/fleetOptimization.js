/**
 * Fleet optimization service.
 * Identifies idle assets and generates redeployment recommendations.
 */

export function getIdleAssets(fleetAssets) {
  return fleetAssets.filter((v) => v.status === 'Idle');
}

export function getRedeploymentCandidates(fleetAssets, enrichedShipments) {
  const idleAssets = getIdleAssets(fleetAssets);

  // Find high-priority shipments that are affected or delayed
  const urgentShipments = enrichedShipments.filter(
    (s) =>
      (s.riskLevel === 'Critical' || s.riskLevel === 'High') &&
      (s.affectedDisruptions.length > 0 || s.delayDays > 0)
  );

  return idleAssets.map((asset) => {
    // Match asset type to shipment cargo type
    let bestMatch = null;
    let reason = '';

    if (asset.type === 'Refrigerated Truck') {
      bestMatch = urgentShipments.find(
        (s) => s.cargoType === 'Cold Storage Food' || s.cargoType === 'Pharmaceuticals'
      );
      reason = 'Reefer unit available for cold-chain cargo requiring urgent re-routing.';
    } else if (asset.type === 'Container Truck') {
      bestMatch = urgentShipments.find(
        (s) => s.cargoType !== 'Cold Storage Food' && s.cargoType !== 'Pharmaceuticals'
      );
      reason = 'Container truck available for general cargo requiring expedited delivery.';
    } else if (asset.type === 'Cargo Vessel') {
      bestMatch = urgentShipments.find(
        (s) => s.affectedDisruptions.length > 0 && s.status === 'Delayed'
      );
      reason = 'Vessel available for bulk rerouting of delayed maritime shipments.';
    } else if (asset.type === 'Rail Wagon') {
      bestMatch = urgentShipments.find(
        (s) => s.route && s.route.some((r) => r.toLowerCase().includes('rail') || r.toLowerCase().includes('moscow') || r.toLowerCase().includes('beijing'))
      );
      reason = 'Rail wagon available at origin point for overland route substitution.';
    } else if (asset.type === 'Cargo Plane') {
      bestMatch = urgentShipments.find(
        (s) => s.riskLevel === 'Critical' || s.priority === 'Critical'
      );
      reason = 'Air freight available for critical shipments requiring immediate dispatch.';
    }

    return {
      asset,
      recommendedFor: bestMatch || null,
      reason: bestMatch ? reason : 'Available for general redeployment as needed.',
    };
  });
}

export function getFleetUtilizationStats(fleetAssets) {
  const total = fleetAssets.length;
  const inUse = fleetAssets.filter((v) => v.status === 'In Use').length;
  const idle = fleetAssets.filter((v) => v.status === 'Idle').length;
  const maintenance = fleetAssets.filter((v) => v.status === 'Maintenance').length;
  const stranded = fleetAssets.filter((v) => v.status === 'Stranded').length;

  return { total, inUse, idle, maintenance, stranded };
}
