"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMockStore } from "@/lib/mock-store";

export default function RepayPage() {
  const params = useParams();
  const debtId = typeof params.debtId === "string" ? params.debtId : "";
  const { state, repayDebt } = useMockStore();
  const debt = state.debts.find((d) => d.id === debtId);
  const [txHash, setTxHash] = useState("");

  if (!debt) {
    return (
      <div className="text-center text-content-muted">
        Debt not found.
        <Link href="/dashboard" className="mt-2 block text-solana hover:underline">
          Dashboard
        </Link>
      </div>
    );
  }

  if (debt.status === "REPAID") {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-xl font-semibold text-content-primary">Repayment recorded</h1>
        <p className="font-mono text-xs text-content-muted">{debt.tronRepaymentTxHash}</p>
        <Link href="/dashboard" className="inline-block text-solana hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const hash = txHash.trim() || `0x${Math.random().toString(16).slice(2, 18)}nile_sim`;
    repayDebt(debtId, hash);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/dashboard" className="text-xs text-solana hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-content-primary">Repay on TRON (Nile)</h1>
        <p className="mt-2 text-sm text-content-muted">
          Simulated flow: paste a tx hash from Nile, or leave blank to mint a fake hash. No chain
          calls in this build.
        </p>
      </div>

      <div className="glass space-y-3 rounded-2xl p-5 text-sm text-content-muted">
        <p>
          <span className="text-content-faint">Amount due:</span>{" "}
          <span className="font-semibold text-content-primary">${debt.amount}</span>
        </p>
        <p>
          <span className="text-content-faint">Fees:</span> Paid in TRX on Nile (show real fees when
          wired to TronWeb).
        </p>
        <p>
          <span className="text-content-faint">If tx fails:</span> Retry with enough TRX for energy
          and bandwidth; hash will not match until success.
        </p>
      </div>

      <form onSubmit={submit} className="glass space-y-4 rounded-2xl p-5">
        <label className="block space-y-1">
          <span className="text-xs text-content-muted">Transaction hash (optional)</span>
          <input
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="w-full rounded-xl border border-glass-border bg-black/30 px-3 py-2 font-mono text-sm text-content-primary outline-none focus:border-tron/50"
            placeholder="Leave empty to simulate"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-tron py-2.5 text-sm font-semibold text-cosmic hover:brightness-110"
        >
          Confirm repayment
        </button>
      </form>
    </div>
  );
}
