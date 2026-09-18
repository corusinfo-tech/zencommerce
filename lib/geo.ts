/**
 * Geo utilities.
 *
 * Per principles.md Section 3.1: radius is measured from the DELIVERY
 * ADDRESS, not the customer's live GPS location. Callers must pass the
 * delivery address coordinates here, never device location directly.
 */

export type LatLng = { lat: number; lng: number };

/** Haversine distance in kilometers between two lat/lng points. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Radius bands per principles.md Section 3.1 — DEFAULT and MAX only. Do not add a third tier without updating principles.md. */
export const RADIUS_BANDS = {
  DEFAULT_KM: 2,
  MAX_KM: 5,
} as const;
