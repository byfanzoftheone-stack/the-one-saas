import { NextRequest, NextResponse } from "next/server";
import { adminOk, recentAudit } from "@/lib/governance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Owner-only audit view. Closed unless ADMIN_TOKEN is set and supplied as a Bearer token.
export async function GET(req: NextRequest) {
  if (!adminOk(req)) return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  return NextResponse.json({ entries: recentAudit(200) });
}
