import { NextResponse } from "next/server";
import whitelabel from "@/data/whitelabel.json";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(whitelabel);
}
