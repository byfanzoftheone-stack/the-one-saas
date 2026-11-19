import { NextRequest, NextResponse } from "next/server";
import { audit, clientKey, rateLimit } from "@/lib/governance";
import { createToken, ensureDemoUser, users } from "@/lib/auth";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  ensureDemoUser();
  const rk = clientKey(req, "login");
  if (!rateLimit(rk, 10, 60_000)) { audit(rk, "login", "rate_limited"); return NextResponse.json({ detail: "Too many attempts" }, { status: 429 }); }
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (users.get(email) !== password) {
    audit(rk, "login", "denied");
    return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
  }
  const token = await createToken(email);
  return NextResponse.json({ token });
}
