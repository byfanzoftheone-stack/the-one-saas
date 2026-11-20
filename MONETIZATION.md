# MONETIZATION

## What the product is
The One SaaS (brand alias: FanzSpot Labs) is a white-label, multi-vertical workspace: installable modules (jobs, crew, tasks), an "Index of Flow" value loop, and a Command brief. Delivered as a done-with-you setup plus a recurring optimization subscription (see `offer.stack.json`, `whitelabel.config.json`).

## Who pays
- Small field-service and trades businesses (roofing, construction, crews) that need a job/crew pad without enterprise software.
- Agencies and consultants who resell it white-label to their own clients.

## Pricing tiers (PLACEHOLDERS - owner approval required before publishing)
Source of truth: `frontend/data/offers.json`.

| Tier | Setup | Monthly | Includes |
|---|---|---|---|
| Starter | $798 | $238 | Index of Flow setup, core automation, monthly review |
| Growth | $997 | $297 | Starter + weekly optimization + white-label pack |
| Premium | $1,595 | $535 | Growth + analytics reporting + outreach compounding |

## Revenue paths
1. Setup fee + monthly subscription via the in-app Pricing tab -> `/api/checkout` (Stripe Checkout, dry-run until approved).
2. White-label resale to agencies (Growth/Premium).
3. Paid module marketplace (modules already carry a `price` in `frontend/data/modules.json`).
4. Done-for-you implementation sprint (see `LAUNCH_SPRINT_14D.md`) sold as a one-time pilot.

## Launch checklist (owner actions)
- [ ] Approve or edit tier prices.
- [ ] Create Stripe products/prices; put IDs in `STRIPE_PRICE_*` env vars (host env, not git).
- [ ] Create a Stripe webhook endpoint -> `/api/stripe/webhook` (events: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed, charge.refunded); set `STRIPE_WEBHOOK_SECRET`, `LICENSE_DB` (persistent).
- [ ] Set `STRIPE_SECRET_KEY`, `SECRET_KEY`, `ADMIN_TOKEN`, `APP_URL` in Vercel/Railway.
- [ ] Test checkout in Stripe test mode, then set `LIVE_ACTIONS_APPROVED=true`.
- [ ] Replace in-memory users/audit with a durable store (Postgres/KV) before real customers.
- [ ] Add terms, privacy policy, refund policy.
- [ ] Review and manually send outreach from `LAUNCH.md`.

## License keys (Stripe webhook)
`POST /api/stripe/webhook` (`frontend/app/api/stripe/webhook/route.ts`) uses a vendored copy of the shared `license-webhook` module (`frontend/lib/vendor/`, provenance + sha256 in `PROVENANCE.md`).
- Verifies `Stripe-Signature` over the RAW body, then on a paid `checkout.session.completed` issues `FZ-<TIER>-...`. Only the sha256 hash is stored; the plaintext waits in an outbox for human delivery. Replays are idempotent; refunds/cancellations/failed payments revoke.
- Tier comes only from env: `STRIPE_PRICE_STARTER|GROWTH|PREMIUM` -> starter|growth|premium. Live checkout now sets `metadata[price_id]` server-side so the webhook can map it. Unknown prices issue nothing.
- Env: `STRIPE_WEBHOOK_SECRET` (unset => 503), `LICENSE_DB`.
- **Storage is in-memory/ephemeral today.** With `LICENSE_DB` unset the JSON file lives in the OS temp dir and is lost on restart or serverless cold start (issued keys, outbox and replay protection all vanish). Set `LICENSE_DB` to persistent disk or swap in a DB (any object with `read()`/`write()`) before real customers. Single-process only.
- Owner delivery (a human sends the key; nothing is sent automatically): `cd frontend && npm run license:owner -- pending [--reveal]` then `npm run license:owner -- delivered <hash> --approver "Name"`. Plaintext output is secret.
- Gating: `validateLicense(key)` in `frontend/lib/license.mjs` returns `{valid, tier}`. No paid-only route exists yet (`/api/execute` is token-auth and ungated), so it is exposed but not applied; use it from a future paid route with an `x-license-key` header.
- Not tested against live Stripe; tested with locally signed payloads (`npm test`).
