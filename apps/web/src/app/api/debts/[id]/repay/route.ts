import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loadDb, mutateDb } from "@/lib/server/db";
import { getTronAddress } from "@/lib/server/auth";
import { verifyTronRepaymentTx } from "@/lib/server/tron";
import { debtUsdToRepaySun, getTronRepayTreasuryBase58 } from "@/lib/server/tron-repay-config";
import { isMockTronRepay } from "@/lib/server/env";
import { eventRepaid, applyRepayment } from "@/lib/server/reputation";
import { nowIso } from "@/lib/server/ids";

export const runtime = "nodejs";

const bodySchema = z.object({
  txHash: z.string().min(8).max(256)
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const tron = getTronAddress(req);
  if (!tron) {
    return NextResponse.json({ error: "Missing X-Tron-Address" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id: debtId } = await ctx.params;

  const db0 = await loadDb();
  const user0 = db0.users.find((u) => u.tronAddress === tron);
  if (!user0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const debt0 = db0.debts.find((d) => d.id === debtId && d.userId === user0.id);
  if (!debt0) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }
  if (debt0.status !== "OPEN") {
    return NextResponse.json({ error: "Debt is not open" }, { status: 400 });
  }

  const treasury = getTronRepayTreasuryBase58();
  if (!isMockTronRepay() && !treasury) {
    return NextResponse.json(
      { error: "Server missing TRON_REPAY_RECEIVER — cannot verify repayments." },
      { status: 503 }
    );
  }

  const minSun = debtUsdToRepaySun(debt0.amount);
  const okChain = await verifyTronRepaymentTx(
    parsed.data.txHash,
    isMockTronRepay() || !treasury
      ? undefined
      : { payerBase58: tron, treasuryBase58: treasury, minSun }
  );
  if (!okChain) {
    return NextResponse.json(
      {
        error:
          "Could not verify TRON transaction (wrong sender/recipient, amount, or not confirmed)."
      },
      { status: 400 }
    );
  }

  await mutateDb((db) => {
    const user = db.users.find((u) => u.tronAddress === tron);
    if (!user) return;
    const di = db.debts.findIndex((d) => d.id === debtId && d.userId === user.id);
    if (di < 0) return;
    const debt = db.debts[di]!;
    if (debt.status !== "OPEN") return;

    db.debts[di] = {
      ...debt,
      status: "REPAID",
      repaidAt: nowIso(),
      tronRepaymentTxHash: parsed.data.txHash
    };

    const ui = db.users.findIndex((u) => u.id === user.id);
    if (ui >= 0) {
      const prev = db.users[ui]!;
      db.users[ui] = applyRepayment(prev, debt.amount);
    }

    db.reputationEvents.unshift(eventRepaid(user.id, debt.amount));
  });

  return NextResponse.json({ ok: true });
}
