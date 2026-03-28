import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { loadDb } from "@/lib/server/db";
import { getTronAddress } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const tron = getTronAddress(req);
  if (!tron) {
    return NextResponse.json({ error: "Missing X-Tron-Address" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const db = await loadDb();
  const user = db.users.find((u) => u.tronAddress === tron);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const request = db.requests.find((r) => r.id === id && r.userId === user.id);
  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const approval = db.approvals.find((a) => a.requestId === id);
  const payment = db.payments.find((p) => p.requestId === id);
  const debt = db.debts.find((d) => d.requestId === id);
  return NextResponse.json({ request, approval, payment, debt });
}
