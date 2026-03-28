import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { loadDb } from "@/lib/server/db";
import { getTronAddress } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const tron = getTronAddress(req);
  if (!tron) {
    return NextResponse.json({ error: "Missing X-Tron-Address" }, { status: 401 });
  }
  const db = await loadDb();
  const user = db.users.find((u) => u.tronAddress === tron);
  if (!user) {
    return NextResponse.json({ error: "User not found — call POST /api/session first" }, { status: 404 });
  }
  return NextResponse.json({ user });
}
