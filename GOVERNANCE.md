# GOVERNANCE

## Principles
1. Human approval before anything that spends money, publishes, or messages outsiders.
2. Everything consequential is audit-logged.
3. No secrets in code or git.
4. Abuse-prone endpoints are rate limited.

## Implemented guardrails (`frontend/lib/governance.ts`)
| Guardrail | Where | Behavior |
|---|---|---|
| Approval gate | `/api/checkout` | Dry-run stub unless `STRIPE_SECRET_KEY`, `STRIPE_PRICE_<TIER>` AND `LIVE_ACTIONS_APPROVED=true` are set by the owner. |
| Audit log | checkout, login | JSON line to stdout + in-memory ring (500). Stripe-style keys and bearer tokens are scrubbed. |
| Audit view | `GET /api/audit` | Closed (403) unless `ADMIN_TOKEN` is set and sent as Bearer. |
| Webhook | `/api/stripe/webhook` | Signature-verified, 120/min/IP, audited; queues keys only, never emails or calls Stripe. |
| Rate limits | login 10/min/IP, checkout 5/min/IP | HTTP 429. |
| Secret hygiene | `lib/auth.ts`, `.gitignore` | Production refuses to sign tokens without `SECRET_KEY`; `.env*` ignored except `.env.example`. |

## Rules for agents and automation
- Outbound email/posts/ads/purchases are drafts only; a human sends them.
- Never commit credentials; use host env vars.
- Any new live-effect route must call `liveApproved()`, `rateLimit()` and `audit()`.

## Known gaps (owner should close before scale)
- Audit log, rate limits and users are in-memory and per-instance.
- Old backend (`backend/app/main.py`): production now refuses the default `SECRET_KEY` and CORS uses an `ALLOWED_ORIGINS` allowlist (no `*`). Still plaintext in-memory fake users; the Next API routes are the active path. Retire it.
- Stripe webhook exists (`/api/stripe/webhook`) but license storage is ephemeral until `LICENSE_DB` is persistent; key delivery is a manual owner step.
- Demo credentials exist in `lib/auth.ts` (demo account).
