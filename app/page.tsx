"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import shopsData from "@/data/shops.json";
import { distanceKm, RADIUS_BANDS, type LatLng } from "@/lib/geo";
import { useCart } from "@/lib/cart-context";

// Mock delivery address (Kaloor, Kochi) — Phase 1 has no address picker yet.
// Per principles.md 3.1, radius is always measured from THIS, not device GPS.
const DELIVERY_ADDRESS: LatLng = { lat: 9.9857, lng: 76.2947 };

type Shop = (typeof shopsData)[number];

export default function HomePage() {
  const [radiusKm, setRadiusKm] = useState<number>(RADIUS_BANDS.DEFAULT_KM);
  const { addItem, totalItems, subtotal, shopIds } = useCart();

  const shopsWithDistance = useMemo(() => {
    return (shopsData as Shop[])
      .map((shop) => ({
        ...shop,
        distance: distanceKm(DELIVERY_ADDRESS, { lat: shop.lat, lng: shop.lng }),
      }))
      .filter((shop) => shop.distance <= radiusKm)
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
          <div className="shop-card" key={shop.id}>
            <div className="shop-card-head">
              <div>
                <div className="shop-name">{shop.name}</div>
                <div className="shop-meta">
                  {shop.category} · {shop.distance.toFixed(1)} km away
                </div>
              </div>
              {!shop.open && <span className="closed-badge">Closed</span>}
            </div>

            {shop.products.map((p) => (
              <div className="product-row" key={p.id}>
                <div>
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
