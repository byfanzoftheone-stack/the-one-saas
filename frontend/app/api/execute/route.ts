import { NextRequest, NextResponse } from "next/server";
import { isDemoUser, verifyToken } from "@/lib/auth";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  try {
    const user = await verifyToken(token);
    if (!user) throw new Error("Invalid token");
    if (isDemoUser(user)) {
      return NextResponse.json({
        user,
        demo: true,
        result: "AI executed",
        message: "Demo mode: sample mission completed without live model spend.",
        next: ["Open modules", "Invite a teammate", "Connect a real API key"],
      });
    }
    return NextResponse.json({ user, result: "AI executed" });
  } catch {
    return NextResponse.json({ detail: "Invalid token" }, { status: 401 });
  }
}
