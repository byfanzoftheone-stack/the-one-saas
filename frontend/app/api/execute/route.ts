import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  try {
    const user = await verifyToken(token);
    if (!user) throw new Error("Invalid token");
    return NextResponse.json({ user, result: "AI executed" });
  } catch {
    return NextResponse.json({ detail: "Invalid token" }, { status: 401 });
  }
}
