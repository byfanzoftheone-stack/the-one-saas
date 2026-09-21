import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({
    modules: [{ name: "The One Crew", price: 49, installed: false }],
  });
}
