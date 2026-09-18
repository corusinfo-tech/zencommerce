# ZenCommerce — Customer Web (Phase 1)

Customer-facing web storefront for the hyperlocal multi-shop marketplace, per `principles.md` Section 6 (web-first rollout, before native apps).

This is the first working piece of the platform: shop discovery within a delivery radius, cart, and a live delivery-fee/ETA quote that implements the core business rules from the principles doc (radius bands, multi-shop surcharge, delivery promise).

## What's implemented

- **Radius toggle** (`app/page.tsx`) — 2km default / 5km expanded, per principles §3.1. Distance is computed from a mock delivery address, not device GPS (matches the principle that address, not live location, drives radius).
- **Delivery fee + ETA engine** (`lib/pricing.ts`) — implements principles §3.2 and §3.3: radius-band surcharge and multi-shop surcharge as two independent variables, shown before checkout, with a plain-language note when an order spans multiple shops.
- **Cart** (`lib/cart-context.tsx`, `app/cart/page.tsx`) — multi-shop aware; groups items by shop and feeds all shop locations into the delivery quote.
- **Mock data** (`data/shops.json`) — 4 shops around Kochi (one marked closed, to demonstrate shop-autonomy availability rule from principles §3.5).

## What's intentionally NOT here yet

- No real backend/database — shop and product data is a static JSON file. Swapping this for real API calls is the next step and shouldn't require changing the pricing/cart logic, since it's already isolated in `lib/`.
- No authentication, no payment gateway — checkout is a placeholder.
- No admin console, shop portal, or delivery partner app — this repo is customer web only. Per the principles doc, those are separate applications and can be scaffolded the same way once this one is validated.
- No address picker — delivery address is hardcoded to one Kochi location for now.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Try adding items from two different shops to the cart to see the multi-shop surcharge and delivery-promise warning kick in.

## Why these choices

Next.js (App Router) + TypeScript was picked for speed: file-based routing, zero backend config needed for a pilot, and a straightforward upgrade path to a real API layer later (API routes or a separate backend service) without touching the frontend structure. No state library, no CSS framework — kept deliberately minimal so this is easy to hand to another developer or extend quickly.

Next step recommendation: stand up the backend (Postgres + PostGIS for real radius queries, as discussed in the platform planning) and replace `data/shops.json` with API calls — the `lib/pricing.ts` and `lib/geo.ts` logic can move server-side unchanged since it's already framework-agnostic.
