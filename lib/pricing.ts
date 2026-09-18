/**
 * Delivery fee + ETA logic.
 *
 * Implements principles.md Section 3.2 (order composition / delivery promise)
 * and 3.3 (delivery fee model). Fee is a function of TWO INDEPENDENT
 * variables — radius band and order composition — do not conflate them.
 *
 * This is pilot/Phase-1 logic: simple, explainable numbers so shop owners
 * and customers can be told exactly why a fee is what it is. Replace the
 * constants (not the shape of the function) as real cost data comes in.
 */

import { distanceKm, RADIUS_BANDS, type LatLng } from "./geo";

export type OrderComposition = "single-shop" | "multi-shop";

export type DeliveryQuote = {
  distanceKm: number;
  radiusBand: "0-2km" | "2-5km";
  composition: OrderComposition;
  baseFee: number;
  radiusSurcharge: number;
  multiShopSurcharge: number;
  totalFee: number;
  etaMinutes: number;
  etaNote: string;
};

const BASE_FEE = 25; // ₹ — flat fee within 0-2km, single shop
const PER_KM_SURCHARGE_BEYOND_2KM = 8; // ₹ per km beyond 2km, up to 5km
const MULTI_SHOP_SURCHARGE = 15; // ₹ — extra pickup/routing time
const ETA_BASE_MINUTES = 30; // single-shop, within 2km
const ETA_PER_KM_BEYOND_2KM = 4; // extra minutes per km beyond 2km
const ETA_MULTI_SHOP_EXTRA_MINUTES = 20; // extra minutes when order spans shops

/**
 * Compute the delivery quote for an order.
 *
 * @param deliveryAddress the customer's chosen delivery address (NOT device GPS)
 * @param shopLocations one LatLng per distinct shop in the cart
 */
export function quoteDelivery(
  deliveryAddress: LatLng,
  shopLocations: LatLng[]
): DeliveryQuote {
  if (shopLocations.length === 0) {
    throw new Error("quoteDelivery requires at least one shop location");
  }

  // Farthest shop determines the radius band and drives distance-based cost —
  // the customer's promise can't be better than the worst-case leg.
  const maxDistance = Math.max(
    ...shopLocations.map((loc) => distanceKm(deliveryAddress, loc))
  );

  if (maxDistance > RADIUS_BANDS.MAX_KM) {
    throw new Error(
      `Shop is ${maxDistance.toFixed(1)}km away — outside the ${RADIUS_BANDS.MAX_KM}km max radius and should not have been shown to this customer.`
    );
  }

  const composition: OrderComposition =
    shopLocations.length > 1 ? "multi-shop" : "single-shop";

  const radiusBand: "0-2km" | "2-5km" =
    maxDistance <= RADIUS_BANDS.DEFAULT_KM ? "0-2km" : "2-5km";

  const kmBeyondDefault = Math.max(0, maxDistance - RADIUS_BANDS.DEFAULT_KM);
  const radiusSurcharge = Math.round(kmBeyondDefault * PER_KM_SURCHARGE_BEYOND_2KM);
  const multiShopSurcharge = composition === "multi-shop" ? MULTI_SHOP_SURCHARGE : 0;

  const totalFee = BASE_FEE + radiusSurcharge + multiShopSurcharge;

  const etaMinutes =
    ETA_BASE_MINUTES +
    Math.round(kmBeyondDefault * ETA_PER_KM_BEYOND_2KM) +
    (composition === "multi-shop" ? ETA_MULTI_SHOP_EXTRA_MINUTES : 0);

  const etaNote =
    composition === "multi-shop"
      ? "This order includes items from multiple shops, so it will arrive in one combined delivery, a bit slower than a single-shop order."
      : "Fastest delivery tier — single shop, one pickup.";

  return {
    distanceKm: Math.round(maxDistance * 10) / 10,
    radiusBand,
    composition,
    baseFee: BASE_FEE,
    radiusSurcharge,
    multiShopSurcharge,
    totalFee,
    etaMinutes,
    etaNote,
  };
}
