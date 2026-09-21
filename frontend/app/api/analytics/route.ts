import { NextResponse } from "next/server";
import analytics from "@/data/analytics.json";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(analytics);
}
