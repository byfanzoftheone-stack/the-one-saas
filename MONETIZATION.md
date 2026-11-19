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
- [ ] Set `STRIPE_SECRET_KEY`, `SECRET_KEY`, `ADMIN_TOKEN`, `APP_URL` in Vercel/Railway.
- [ ] Test checkout in Stripe test mode, then set `LIVE_ACTIONS_APPROVED=true`.
- [ ] Replace in-memory users/audit with a durable store (Postgres/KV) before real customers.
- [ ] Add terms, privacy policy, refund policy.
- [ ] Review and manually send outreach from `LAUNCH.md`.
