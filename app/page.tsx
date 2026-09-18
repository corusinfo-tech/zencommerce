"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import shopsData from "@/data/shops.json";
import { distanceKm, RADIUS_BANDS, type LatLng } from "@/lib/geo";
import { quoteDelivery } from "@/lib/pricing";
import { useCart } from "@/lib/cart-context";

// Mock delivery address (Kaloor, Kochi) — Phase 1 has no address picker yet.
// Per principles.md 3.1, radius is always measured from THIS, not device GPS.
const DELIVERY_ADDRESS: LatLng = { lat: 9.9857, lng: 76.2947 };

type Shop = (typeof shopsData)[number];

function coverClass(category: string) {
  const key = category.toLowerCase();
  if (key.includes("grocery")) return "cover-grocery";
  if (key.includes("pharmacy")) return "cover-pharmacy";
  if (key.includes("bakery")) return "cover-bakery";
  return "cover-default";
}

export default function HomePage() {
  const [radiusKm, setRadiusKm] = useState<number>(RADIUS_BANDS.DEFAULT_KM);
  const { addItem, totalItems, subtotal, shopIds } = useCart();

  const shopsWithDistance = useMemo(() => {
    return (shopsData as Shop[])
      .map((shop) => ({
        ...shop,
        distance: distanceKm(DELIVERY_ADDRESS, { lat: shop.lat, lng: shop.lng }),
      }))
      // Filter to the selected radius BEFORE computing a delivery quote —
      // quoteDelivery() intentionally throws for anything beyond the platform's
      // 5km max (principles.md §3.1), so it must never be called on a shop
      // that hasn't already passed the radius check.
      .filter((shop) => shop.distance <= radiusKm)
      .map((shop) => ({
        ...shop,
        eta: quoteDelivery(DELIVERY_ADDRESS, [{ lat: shop.lat, lng: shop.lng }]),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [radiusKm]);

  return (
    <main>
      <div className="header">
        <h1>Shops near you</h1>
        <span style={{ fontSize: 13, color: "#6b6b6b" }}>Kaloor, Kochi</span>
      </div>

      <div className="container">
        <div className="radius-toggle">
          <button
            className={radiusKm === RADIUS_BANDS.DEFAULT_KM ? "active" : ""}
            onClick={() => setRadiusKm(RADIUS_BANDS.DEFAULT_KM)}
          >
            Within {RADIUS_BANDS.DEFAULT_KM} km
          </button>
          <button
            className={radiusKm === RADIUS_BANDS.MAX_KM ? "active" : ""}
            onClick={() => setRadiusKm(RADIUS_BANDS.MAX_KM)}
          >
            Up to {RADIUS_BANDS.MAX_KM} km
          </button>
        </div>
        <p className="radius-note">
          {radiusKm === RADIUS_BANDS.DEFAULT_KM
            ? "Showing shops within your default radius — fastest, lowest delivery fee."
            : "Wider radius selected — delivery fee will be higher and may take longer (see principles.md §3.1, §3.3)."}
        </p>

        {shopsWithDistance.length === 0 && (
          <div className="empty-state">No shops within {radiusKm}km yet.</div>
        )}

        {shopsWithDistance.map((shop) => (
          <div className={`shop-card ${!shop.open ? "is-closed" : ""}`} key={shop.id}>
            <div className={`shop-cover ${coverClass(shop.category)}`}>
              <span className="shop-cover-name">{shop.name}</span>
              {shop.open ? (
                <span className="eta-badge">⏱ ~{shop.eta.etaMinutes} min</span>
              ) : (
                <span className="closed-ribbon">Closed</span>
              )}
            </div>

            <div className="shop-card-body">
              <div className="shop-card-head">
                <div className="shop-meta">
                  <span className="category-chip">{shop.category}</span>
                  <span>{shop.distance.toFixed(1)} km away</span>
                </div>
                {!shop.open && <span className="closed-badge">Unavailable</span>}
              </div>

              {shop.products.map((p) => (
                <div className="product-row" key={p.id}>
                  <div className="product-thumb" />
                  <div className="product-info">
                    <div className="product-name">{p.name}</div>
                    <div className="product-price">₹{p.price}</div>
                  </div>
                  <button
                    className="add-btn"
                    disabled={!shop.open}
                    onClick={() =>
                      addItem({
                        shopId: shop.id,
                        productId: p.id,
                        name: p.name,
                        price: p.price,
                      })
                    }
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {totalItems > 0 && (
        <div className="cart-bar">
          <span>
            {totalItems} item{totalItems > 1 ? "s" : ""} · ₹{subtotal}
            {shopIds.length > 1 ? " · multiple shops" : ""}
          </span>
          <Link href="/cart">View cart →</Link>
        </div>
      )}
    </main>
  );
}
