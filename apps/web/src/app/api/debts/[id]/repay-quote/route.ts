import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTronAddress } from "@/lib/server/auth";
import { loadDb } from "@/lib/server/db";
import { isMockTronRepay } from "@/lib/server/env";
import { debtUsdToRepaySun, getTronRepayTreasuryBase58 } from "@/lib/server/tron-repay-config";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const tron = getTronAddress(req);
  if (!tron) {
    return NextResponse.json({ error: "Missing X-Tron-Address" }, { status: 401 });
  }

  const { id: debtId } = await ctx.params;
  const db = await loadDb();
  const user = db.users.find((u) => u.tronAddress === tron);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const debt = db.debts.find((d) => d.id === debtId && d.userId === user.id);
  if (!debt) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }
  if (debt.status !== "OPEN") {
    return NextResponse.json({ error: "Debt is not open" }, { status: 400 });
  }

  const mock = isMockTronRepay();
  const treasury = getTronRepayTreasuryBase58();
  if (!mock && !treasury) {
    return NextResponse.json(
      { error: "Server missing TRON_REPAY_RECEIVER (treasury base58)." },
      { status: 503 }
    );
  }

  const amountSun = debtUsdToRepaySun(debt.amount);

  return NextResponse.json({
    debtId,
    amountUsd: debt.amount,
    asset: "TRX",
    toAddress: mock ? "TMockTreasuryProofOfTrust111111111" : treasury,
    amountSun,
    fromAddress: tron,
    mock
  });
}
