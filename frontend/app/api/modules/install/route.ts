import { NextRequest, NextResponse } from "next/server";
import { getModules, setInstalled } from "@/lib/modules";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const token = String(body.token || req.nextUrl.searchParams.get("token") || "").trim();

  if (!name) {
    return NextResponse.json({ detail: "name required" }, { status: 400 });
  }

  // Token optional for demo UX; if provided, must be valid
  if (token) {
    try {
      await verifyToken(token);
    } catch {
      return NextResponse.json({ detail: "Invalid token" }, { status: 401 });
    }
  }

  const current = getModules().find((m) => m.name === name);
  if (!current) {
    return NextResponse.json({ detail: "Module not found" }, { status: 404 });
  }

  const next = setInstalled(name, !current.installed);
  return NextResponse.json({ module: next, modules: getModules() });
}
