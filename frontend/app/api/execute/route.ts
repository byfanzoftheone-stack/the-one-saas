import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const body = await req.json().catch(() => ({}));
  try {
    const user = await verifyToken(token);
    if (!user) throw new Error("Invalid token");

    const installed: string[] = Array.isArray(body.installed) ? body.installed : [];
    const openJobs = Number(body.openJobs || 0);
    const crew = Number(body.crew || 0);

    const next: string[] = [];
    if (!installed.length) next.push("Install Construction Ops or Crew, then add a real job or person.");
    if (installed.includes("Construction Ops") && openJobs === 0) {
      next.push("Add today's job: address + notes. Do not price it without squares and pitch.");
    }
    if (installed.includes("The One Crew") && crew === 0) {
      next.push("Add the people who will be on site.");
    }
    if (openJobs > 0) next.push("Keep the open job current: status, notes, what is left.");
    if (!next.length) next.push("Workspace is live. Log the next field action.");

    return NextResponse.json({
      user,
      result: "workspace-brief",
      message: `Workspace live. ${installed.length} module${installed.length === 1 ? "" : "s"}, ${openJobs} open job${openJobs === 1 ? "" : "s"}, ${crew} crew.`,
      next,
    });
  } catch {
    return NextResponse.json({ detail: "Invalid token" }, { status: 401 });
  }
}
