"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type CartItem = {
  shopId: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (shopId: string, productId: string) => void;
  clear: () => void;
  shopIds: string[];
  totalItems: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

// In-memory cart for the Phase-1 pilot. Swap for a persisted/server cart
// once accounts and checkout are wired to the real backend — do not add
// browser localStorage here casually, cart state should move server-side
// alongside auth rather than living only on-device.
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: Omit<CartItem, "qty">) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.shopId === item.shopId && i.productId === item.productId
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem = (shopId: string, productId: string) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.shopId === shopId && i.productId === productId
            ? { ...i, qty: i.qty - 1 }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  };

  const clear = () => setItems([]);

  const shopIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.shopId))),
    [items]
  );
  const totalItems = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.qty * i.price, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, clear, shopIds, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
