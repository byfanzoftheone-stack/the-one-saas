import { NextRequest, NextResponse } from "next/server";
import { audit, clientKey, rateLimit } from "@/lib/governance";
import { getLicenseWebhook } from "@/lib/license.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe webhook -> license key. Verifies the signature over the RAW bytes, records a hash-only license and
// QUEUES the plaintext key for human-approved delivery. It never sends email and never calls Stripe, so it is
// not gated on LIVE_ACTIONS_APPROVED (nothing leaves the system); it is signature-gated, rate limited and audited.
// Raw body: a Next route handler does not parse the body for us; we read bytes with arrayBuffer() on THIS route only.
export async function POST(req: NextRequest) {
  const key = clientKey(req, "stripe-webhook");
  if (!rateLimit(key, 120, 60_000)) {
    audit(key, "stripe_webhook", "rate_limited");
    return NextResponse.json({ detail: "Too many requests" }, { status: 429 });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    audit(key, "stripe_webhook", "not_configured");
    return NextResponse.json({ detail: "Webhook not configured" }, { status: 503 });
  }
  const raw = Buffer.from(await req.arrayBuffer());
  let lw;
  try {
    lw = await getLicenseWebhook((r: Record<string, unknown>) =>
      audit("stripe-webhook", String(r.type), String(r.reason ?? "ok"), r)
    );
  } catch {
    // Fail closed: no/unreachable license store. 503 makes Stripe retry later; nothing is issued or lost.
    audit(key, "stripe_webhook", "store_not_configured");
    return NextResponse.json({ detail: "License store not configured" }, { status: 503 });
  }
  try {
    const out = await lw.handle(raw, req.headers.get("stripe-signature"));
    return NextResponse.json(out.body, { status: out.status });
  } catch {
    // Transaction rolled back; Stripe will retry.
    audit(key, "stripe_webhook", "store_error");
    return NextResponse.json({ detail: "Temporary error" }, { status: 503 });
  }
}
