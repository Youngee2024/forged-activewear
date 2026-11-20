# FORGED Resend email integration

## Current flow

The existing checkout remains the only order-creation path. It validates the form, creates the order, writes it to the existing `forged-orders` browser store and only then requests transactional notifications from `POST /api/order-notifications`.

The Vercel function:

1. validates the customer, address, products, variants and totals;
2. verifies item prices and delivery fees against the existing catalogue configuration;
3. renders separate customer and administrator messages;
4. submits both through the official Resend SDK;
5. uses `order-created/customer/<reference>` and `order-created/admin/<reference>` idempotency keys;
6. reports customer and administrator submissions independently as complete, partial or failed;
7. never changes payment or fulfilment status.

Email failure does not remove or recreate a successfully stored order. A repeated local request for the same order reference is not submitted again. Resend provider idempotency also protects retries during its idempotency window.

The endpoint returns HTTP `200` when both submissions succeed, `207` when exactly one succeeds and `502` when both fail. Validation and configuration errors return `400` and `503` respectively. These outcomes mean Resend accepted a submission; final inbox delivery still belongs to Resend's asynchronous delivery lifecycle.

## Required Vercel environment variables

Configure these separately for Production, Preview and Development where email delivery is intended:

- `RESEND_API_KEY`: server-only Resend API key.
- `FORGED_ADMIN_EMAIL`: recipient for new-order notifications.
- `FORGED_FROM_EMAIL`: verified sender, for example `FORGED <orders@example.com>`.
- `FORGED_SITE_URL`: optional absolute public URL used for tracking and administrator links. Vercel deployment URLs are used when omitted.

Never prefix these variables with `VITE_`; doing so would expose them to browser bundles.

Bank-transfer fields are optional and must remain disabled until the business has verified every value:

- `FORGED_BANK_DETAILS_VERIFIED=false`
- `FORGED_BANK_NAME`
- `FORGED_BANK_ACCOUNT_NAME`
- `FORGED_BANK_ACCOUNT_NUMBER`

When verification is false, customer emails explicitly state that verified instructions are unavailable and do not display account details.

## Resend production readiness

Before enabling production delivery:

1. Add the sending domain in the Resend dashboard.
2. Publish the required SPF and DKIM DNS records.
3. Wait until Resend shows the domain as verified.
4. Set `FORGED_FROM_EMAIL` to an address on that verified domain.
5. Configure the required Vercel variables for each intended environment.
6. Run a controlled Preview delivery before enabling Production.

An API key alone does not verify the sending domain.

## Security and reliability boundary

The API key and administrator address are read only inside the Vercel function and are never returned to the client. Public responses contain coarse outcome codes and per-destination submission booleans only. Failure logs contain the order reference, destination role, provider error name and HTTP status when available; they exclude credentials, recipient addresses, customer details and full provider responses.

The current application persists orders only in browser `localStorage`. That is not an authoritative database and cannot prove to a server that an order was durably created. Before production, move the existing order-creation transaction to a server-backed database and invoke `sendOrderCreatedEmails` from that successful transaction or an outbox worker. At that point:

- accept only a server-owned persisted order identifier;
- load the order from the database rather than accepting customer totals;
- add durable email event/outbox records beyond Resend's provider idempotency window;
- apply rate limiting and abuse protection to order creation;
- keep customer, administrator, payment and fulfilment events separate.

The email service is intentionally structured so later real status transitions can add payment-confirmed, processing, shipped, delivered and cancelled templates without manufacturing those events now.
