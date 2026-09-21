import { NextRequest, NextResponse } from "next/server";
import { createToken, ensureDemoUser, users } from "@/lib/auth";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  ensureDemoUser();
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (users.get(email) !== password) {
    return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
  }
  const token = await createToken(email);
  return NextResponse.json({ token });
}
