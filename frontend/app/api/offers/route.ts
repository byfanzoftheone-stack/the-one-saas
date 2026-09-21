import { NextResponse } from "next/server";
import offers from "@/data/offers.json";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(offers);
}
