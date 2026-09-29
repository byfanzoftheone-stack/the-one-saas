import { NextResponse } from "next/server";
import { createToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const email = "owner@the-one-saas.local";
  const token = await createToken(email);
  return NextResponse.json({
    email,
    token,
    mode: "workspace",
    message: "Workspace session started on this device.",
  });
}
