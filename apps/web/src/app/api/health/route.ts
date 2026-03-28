import { NextResponse } from "next/server";
import { loadDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await loadDb();
    return NextResponse.json({ ok: true, db: "reachable" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
