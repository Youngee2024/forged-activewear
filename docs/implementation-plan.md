# FORGED commerce implementation plan

## Confirmed purchase model

FORGED must support guest checkout and optional customer accounts. Registration must never be required to purchase.

### Guest checkout

A guest can add mixed-category products to one cart, continue directly to checkout, provide a full name, email address, phone number and Nigerian delivery address, review the order, choose bank transfer and receive a unique order reference. Guest tracking must verify ownership with more than a guessable order number; the production design should use a short-lived signed link or one-time code sent to the checkout email or phone.

### Optional accounts

An account provides secure registration and sign-in, profile management, saved delivery addresses, current order status, order details and order history. Account creation is an optional convenience before or after checkout.

After a guest purchase, account creation may claim earlier orders only after ownership verification. The backend should match a verified email or phone and perform an audited server-side association; the browser must not be able to attach an order merely by submitting an order reference.

## Canonical order model

Guest and registered purchases use the same order table and status workflow. Account ownership is optional rather than a separate order type.

Recommended entities:

- `customers`: authenticated account profile, verified email and verified phone metadata.
- `addresses`: customer-owned Nigerian delivery addresses; checkout also snapshots the selected address onto the order.
- `orders`: unique public reference, nullable `customer_id`, guest contact snapshot, currency, server-calculated totals, payment status, fulfilment status and timestamps.
- `order_items`: product and variant identifiers plus immutable name, SKU, option, unit-price and quantity snapshots.
- `payments`: bank-transfer claim/reference, submission time, reviewer, review time and payment state. Never stores a fabricated success.
- `order_status_events`: append-only customer-visible and internal status history.
- `inventory_variants`: authoritative available quantity or availability state per product option, with transactional reservation/decrement rules.
- `admin_audit_events`: administrator, action, affected record and timestamp for payment and fulfilment changes.

The current `src/types.ts` model is a browser prototype. Production identifiers and totals must be created or recalculated by the server; client-provided prices, payment states and customer ownership cannot be trusted.

## Bank-transfer workflow

1. The server validates the cart, current variants and prices and creates an unpaid order with a unique reference.
2. The site displays bank instructions only from a protected, verified business configuration.
3. The customer transfers independently and submits the transaction reference or approved evidence.
4. The payment remains `Awaiting Payment` or `Payment Under Review`.
5. An authorised administrator verifies the transfer and records an audited decision.
6. Only the administrator-controlled server action can set the payment to `Paid` and advance fulfilment.
7. The customer sees the updated status through their account or secure guest-order verification.

The current prototype intentionally withholds bank details because none are verified. It must never automatically mark a transfer as paid.

## Production architecture

- Use a server-backed database and authentication provider such as Supabase, or an equivalent platform supporting transactions and row-level access controls.
- Keep guest order creation as a public server endpoint with validation, rate limiting and abuse protection.
- Restrict customer queries to orders owned by the authenticated account. Expose guest orders only through signed, expiring verification sessions.
- Restrict payment review, bank configuration, inventory changes and fulfilment updates to authorised administrator roles.
- Store secrets and verified bank configuration server-side; never bundle them in public JavaScript.
- Generate order references with collision-resistant server-side identifiers rather than timestamps.
- Recalculate totals and delivery fees server-side and snapshot product data into order items.
- Perform inventory validation and reservation/decrement transactionally to prevent overselling.
- Send transactional order and verification messages through an approved email/SMS provider without exposing whether an account exists.
- Log sensitive status and ownership changes for audit and customer-support investigation.

## Delivery phases

1. Replace `localStorage` orders with server-created guest orders and secure guest tracking.
2. Add authentication, profile and saved-address tables without changing guest checkout.
3. Add account order history and verified guest-order claiming.
4. Add protected administrator payment review, fulfilment controls and audit events.
5. Connect variant inventory and transactional order allocation.
6. Configure verified bank details, approved delivery/returns terms and transactional notifications.

## Transactional email

The Resend integration is isolated in `api/_lib/order-email.ts`, with the Vercel entry point at `api/order-notifications.ts`. It currently supports order-created customer and administrator notifications only. Future status emails must be triggered by real, persisted status transitions from the production backend. Configuration and the current persistence boundary are documented in `docs/email-integration.md`.

## Current limitations

- Orders, cart and statuses exist only in the current browser.
- The demo administrator gate is not authentication.
- Guest tracking by order reference and email is demonstrative, not secure enough for production.
- No registered-customer account system or saved address storage exists yet.
- No verified bank details, production inventory, transactional messaging or server-side order reference generation is configured.
