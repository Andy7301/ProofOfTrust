import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
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
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const requests = db.requests.filter((r) => r.userId === user.id);
  const debts = db.debts.filter((d) => d.userId === user.id);
  const approvals = db.approvals.filter((a) => requests.some((r) => r.id === a.requestId));
  const payments = db.payments.filter((p) => requests.some((r) => r.id === p.requestId));
  const reputationEvents = db.reputationEvents.filter((e) => e.userId === user.id);

  return NextResponse.json({
    user,
    requests,
    debts,
    approvals,
    payments,
    reputationEvents
  });
}
