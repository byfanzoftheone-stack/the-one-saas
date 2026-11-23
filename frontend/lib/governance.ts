// Governance guardrails: rate limiting, audit logging, human-approval gate.
// Zero dependencies. State is in-memory (per server instance); swap for a durable store before scale.

type Entry = { ts: string; actor: string; action: string; outcome: string; detail?: Record<string, unknown> };

const g = globalThis as any;
if (!g.__auditLog) g.__auditLog = [] as Entry[];
if (!g.__rate) g.__rate = new Map<string, { n: number; reset: number }>();
const log: Entry[] = g.__auditLog;
const buckets: Map<string, { n: number; reset: number }> = g.__rate;

const SECRET_PATTERN = /(sk_(live|test)_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+|Bearer\s+[A-Za-z0-9._-]+)/g;

function scrub(v: unknown): unknown {
  return JSON.parse(JSON.stringify(v ?? null, (_k, x) => (typeof x === "string" ? x.replace(SECRET_PATTERN, "[redacted]") : x)));
}

/** Append an audit record (also emitted as one JSON line to stdout for log drains). Secrets are scrubbed. */
export function audit(actor: string, action: string, outcome: string, detail?: Record<string, unknown>) {
  const e: Entry = { ts: new Date().toISOString(), actor, action, outcome, detail: detail ? (scrub(detail) as any) : undefined };
  log.push(e);
  if (log.length > 500) log.shift();
  console.log(JSON.stringify({ audit: e }));
}

export function recentAudit(limit = 100) {
  return log.slice(-limit);
}

/** Fixed-window rate limit. Returns true when the call is allowed. */
export function rateLimit(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  b.n += 1;
  return b.n <= max;
}

export function clientKey(req: Request, scope: string) {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  return `${scope}:${ip}`;
}

/**
 * Human-approval gate for anything that spends money, publishes, or messages outsiders.
 * Live mode requires BOTH a configured provider key AND the owner flipping LIVE_ACTIONS_APPROVED=true.
 * Anything else is a dry-run stub.
 */
export function liveApproved(): boolean {
  return process.env.LIVE_ACTIONS_APPROVED === "true";
}

export function adminOk(req: Request): boolean {
  const want = process.env.ADMIN_TOKEN;
  if (!want) return false; // closed by default
  const got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return got.length > 0 && got === want;
}
