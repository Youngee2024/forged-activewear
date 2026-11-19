# FORGED Activewear Storefront

A premium React + TypeScript + Vite e-commerce prototype for FORGED ACTIVEWEAR COLLECTIONS.

## Run locally

```bash
npm install
npm run dev
```

Production build check: `npm run build`.

## Included journey

- Searchable and filterable sample catalogue.
- Product galleries, variants, wishlist and persistent cart.
- Guest checkout in NGN with Nigerian delivery fields.
- Order creation with bank-transfer instructions withheld until verified business details are configured.
- Payment submission that remains under manual review.
- Order tracking by order number and checkout email.
- Demo administrator review, approval and rejection workflow.

## Prototype boundaries

This repository does not accept real payments. No bank details are displayed because verified business instructions have not been supplied. Support contacts, policies and inventory remain placeholders. Customer, cart and order data are stored in browser `localStorage` only.

The admin demo passcode is `FORGED-DEMO`. It is a visual prototype gate, not authentication.

Before production, connect Supabase (or an equivalent backend) for server-side prices and totals, order persistence, guest-order verification, optional customer accounts, authenticated role-based administration, row-level security, protected bank configuration, audit logs, newsletter storage and optional secure receipt uploads. Legal, delivery and return policies require business approval.

Guest checkout must remain available without registration. Optional accounts will provide profiles, saved Nigerian delivery addresses and order history. See [`docs/implementation-plan.md`](docs/implementation-plan.md) for the proposed account, order and bank-transfer architecture.

## Image assets

`public/images/forged-hero.png` and the `*-v2.png` catalogue/detail assets were generated for this project using the built-in image-generation tool. They are clearly labelled as temporary visuals and do not represent confirmed FORGED inventory. `public/images/sample-*.jpg` are sample editorial images sourced from Unsplash.
