"use client";

import { useMemo } from "react";
import Link from "next/link";
import shopsData from "@/data/shops.json";
import { useCart } from "@/lib/cart-context";
import { quoteDelivery } from "@/lib/pricing";
import type { LatLng } from "@/lib/geo";

const DELIVERY_ADDRESS: LatLng = { lat: 9.9857, lng: 76.2947 };

export default function CartPage() {
  const { items, removeItem, addItem, subtotal, shopIds } = useCart();

  const shopLocations = useMemo<LatLng[]>(() => {
    return shopIds
      .map((id) => shopsData.find((s) => s.id === id))
      .filter(Boolean)
      .map((s) => ({ lat: s!.lat, lng: s!.lng }));
  }, [shopIds]);

  const quote =
    shopLocations.length > 0 ? quoteDelivery(DELIVERY_ADDRESS, shopLocations) : null;

  return (
    <main>
      <div className="header">
        <h1>Your cart</h1>
        <Link href="/" style={{ fontSize: 13 }}>
          ← Back
        </Link>
      </div>

      <div className="container">
        {items.length === 0 && (
          <div className="empty-state">
            Your cart is empty. <Link href="/">Browse shops</Link>
          </div>
        )}

        {shopIds.map((shopId) => {
          const shop = shopsData.find((s) => s.id === shopId)!;
          const shopItems = items.filter((i) => i.shopId === shopId);
          return (
            <div className="shop-card" key={shopId}>
              <div className="shop-name">{shop.name}</div>
              {shopItems.map((item) => (
                <div className="product-row" key={item.productId}>
                  <div>
                    <div className="product-name">{item.name}</div>
                    <div className="product-price">
                      ₹{item.price} × {item.qty}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      className="add-btn"
                      onClick={() => removeItem(item.shopId, item.productId)}
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      className="add-btn"
                      onClick={() =>
                        addItem({
                          shopId: item.shopId,
                          productId: item.productId,
                          name: item.name,
                          price: item.price,
                        })
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {quote && (
          <div className="quote-box">
            <div className="quote-row">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="quote-row">
              <span>Delivery ({quote.radiusBand}, {quote.distanceKm}km)</span>
              <span>₹{quote.baseFee + quote.radiusSurcharge}</span>
            </div>
            {quote.multiShopSurcharge > 0 && (
              <div className="quote-row">
                <span>Multi-shop surcharge</span>
                <span>₹{quote.multiShopSurcharge}</span>
              </div>
            )}
            <div className="quote-row quote-total">
              <span>Total</span>
              <span>₹{subtotal + quote.totalFee}</span>
            </div>
            <div className="quote-row">
              <span>Estimated delivery</span>
              <span>~{quote.etaMinutes} min</span>
            </div>

            {quote.composition === "multi-shop" && (
              <div className="multi-shop-warning">{quote.etaNote}</div>
            )}
          </div>
        )}

        {items.length > 0 && (
          <button
            className="add-btn"
            style={{ width: "100%", marginTop: 16, padding: 12, fontSize: 15 }}
            onClick={() => alert("Checkout is not wired to a payment gateway yet — this is the Phase 1 pricing/flow demo.")}
          >
            Proceed to checkout
          </button>
        )}
      </div>
    </main>
  );
}
