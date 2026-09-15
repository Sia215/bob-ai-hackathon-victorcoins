import { disruptions } from '../data/disruptions';

/**
 * Returns the list of disruptions affecting a shipment.
 */
export function getAffectingDisruptions(shipment) {
  if (!shipment.affectedDisruptions || shipment.affectedDisruptions.length === 0) return [];
  return disruptions.filter((d) => shipment.affectedDisruptions.includes(d.id));
}

/**
 * Returns all shipments affected by a specific disruption ID.
 */
export function getShipmentsForDisruption(disruptionId, shipments) {
  return shipments.filter(
    (s) => s.affectedDisruptions && s.affectedDisruptions.includes(disruptionId)
  );
}

/**
 * Returns a summary count of affected shipments per disruption.
 */
export function getDisruptionImpactSummary(shipments) {
  return disruptions.map((d) => ({
    ...d,
    affectedShipmentCount: getShipmentsForDisruption(d.id, shipments).length,
  }));
}
