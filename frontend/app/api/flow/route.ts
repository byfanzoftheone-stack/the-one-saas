import { NextResponse } from "next/server";
import flow from "@/data/flow.json";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(flow);
}
