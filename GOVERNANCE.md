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
| Rate limits | login 10/min/IP, checkout 5/min/IP | HTTP 429. |
| Secret hygiene | `lib/auth.ts`, `.gitignore` | Production refuses to sign tokens without `SECRET_KEY`; `.env*` ignored except `.env.example`. |

## Rules for agents and automation
- Outbound email/posts/ads/purchases are drafts only; a human sends them.
- Never commit credentials; use host env vars.
- Any new live-effect route must call `liveApproved()`, `rateLimit()` and `audit()`.

## Known gaps (owner should close before scale)
- Audit log, rate limits and users are in-memory and per-instance.
- Backend (`backend/app/main.py`) still uses a default `SECRET_KEY`, `ALLOWED_ORIGINS=*`, plaintext fake users; the Next API routes are the active path. Harden or retire it.
- No Stripe webhook handler yet (needed to provision paid access).
- Demo credentials exist in `lib/auth.ts` (demo account).
