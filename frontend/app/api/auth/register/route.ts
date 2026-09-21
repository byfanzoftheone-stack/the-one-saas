import { NextRequest, NextResponse } from "next/server";
import { users } from "@/lib/auth";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return NextResponse.json({ detail: "email and password required" }, { status: 400 });
  if (users.has(email)) return NextResponse.json({ detail: "User exists" }, { status: 400 });
  users.set(email, password);
  return NextResponse.json({ msg: "registered" });
}
