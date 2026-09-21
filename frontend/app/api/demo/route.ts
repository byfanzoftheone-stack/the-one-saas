import { NextResponse } from "next/server";
import { DEMO_EMAIL, DEMO_PASSWORD, createToken, ensureDemoUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  ensureDemoUser();
  const token = await createToken(DEMO_EMAIL);
  return NextResponse.json({
    demo: true,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    token,
    execute: {
      user: DEMO_EMAIL,
      demo: true,
      result: "AI executed",
      message: "Demo mode: sample mission completed without live model spend.",
      next: ["Open modules", "Invite a teammate", "Connect a real API key"],
    },
  });
}

export async function GET() {
  return NextResponse.json({
    demo: true,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    hint: "POST /api/demo to get a demo token and sample execute result",
  });
}
