import { NextRequest, NextResponse } from "next/server";
import offers from "@/data/offers.json";
import { audit, clientKey, liveApproved, rateLimit } from "@/lib/governance";

export const runtime = "nodejs";

// Checkout: DRY-RUN STUB by default. A real Stripe Checkout Session is created only when
// STRIPE_SECRET_KEY + STRIPE_PRICE_<TIER> are set AND the owner sets LIVE_ACTIONS_APPROVED=true.
export async function POST(req: NextRequest) {
  const key = clientKey(req, "checkout");
  if (!rateLimit(key, 5, 60_000)) {
    audit(key, "checkout", "rate_limited");
    return NextResponse.json({ detail: "Too many requests" }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const tierKey = String(body.tier || "");
  const tier = (offers.tiers as any[]).find((t) => t.key === tierKey);
  if (!tier) return NextResponse.json({ detail: "Unknown tier" }, { status: 400 });

  const secret = process.env.STRIPE_SECRET_KEY;
  const price = process.env[`STRIPE_PRICE_${tierKey.toUpperCase()}`];
  const base = process.env.APP_URL || "http://localhost:3000";

  if (!secret || !price || !liveApproved()) {
    audit(key, "checkout", "stub", { tier: tierKey, configured: Boolean(secret && price), approved: liveApproved() });
    return NextResponse.json({
      mode: "stub",
      tier: tierKey,
      message: "Checkout is in dry-run. Owner must set Stripe env vars and LIVE_ACTIONS_APPROVED=true (see GOVERNANCE.md).",
    });
  }

  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    // Server-side price id so the webhook can map price -> tier (never trust client-supplied tier).
    "metadata[price_id]": price,
    success_url: `${base}/?checkout=success`,
    cancel_url: `${base}/?checkout=cancel`,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    audit(key, "checkout", "provider_error", { status: res.status });
    return NextResponse.json({ detail: "Checkout provider error" }, { status: 502 });
  }
  audit(key, "checkout", "session_created", { tier: tierKey, id: data.id });
  return NextResponse.json({ mode: "live", url: data.url });
}
