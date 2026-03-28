"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { TxExplorerLink } from "@/components/tx-explorer-link";
import { tronExplorerHomeUrl, tronTxExplorerUrl } from "@/lib/explorer-links";
import { useMockStore } from "@/lib/mock-store";

export default function RepayPage() {
  const params = useParams();
  const debtId = typeof params.debtId === "string" ? params.debtId : "";
  const { state, repayDebtFromWallet, repayDebt } = useMockStore();
  const debt = state.debts.find((d) => d.id === debtId);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    const url = debt.tronRepaymentTxHash ? tronTxExplorerUrl(debt.tronRepaymentTxHash) : null;
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-xl font-semibold text-content-primary">Repayment recorded</h1>
        <p className="text-sm text-content-muted">
          Transaction:{" "}
          <TxExplorerLink
            label={debt.tronRepaymentTxHash ?? "—"}
            url={url}
            mono
          />
        </p>
        <Link href="/dashboard" className="inline-block text-solana hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const payWithWallet = async () => {
    setError(null);
    setBusy(true);
    try {
      await repayDebtFromWallet(debtId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const hash = txHash.trim();
    if (!hash) {
      setError("Enter a transaction id or use Pay with TronLink.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await repayDebt(debtId, hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/dashboard" className="text-xs text-solana hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-content-primary">Repay on TRON</h1>
        <p className="mt-2 text-sm text-content-muted">
          Primary flow: TronLink opens a native <span className="text-tron">TRX</span> transfer to the
          treasury configured on the server. Amount follows{" "}
          <code className="text-content-faint">TRON_SUN_PER_DEBT_DOLLAR</code> × debt (USD).
        </p>
      </div>

      <div className="glass space-y-3 rounded-2xl p-5 text-sm text-content-muted">
        <p>
          <span className="text-content-faint">Amount due (app USD):</span>{" "}
          <span className="font-semibold text-content-primary">${debt.amount}</span>
        </p>
        <p>
          <span className="text-content-faint">Explorer:</span>{" "}
          <a
            href={tronExplorerHomeUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-tron underline decoration-tron/40 hover:decoration-tron"
          >
            TronScan (this network)
          </a>
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void payWithWallet()}
        className="w-full rounded-xl bg-tron py-3 text-sm font-semibold text-cosmic hover:brightness-110 disabled:opacity-50"
      >
        {busy ? "Working…" : "Pay with TronLink (TRX)"}
      </button>

      <details className="glass rounded-2xl p-4 text-sm text-content-muted">
        <summary className="cursor-pointer text-content-primary">Advanced: paste tx id</summary>
        <form onSubmit={(e) => void submitManual(e)} className="mt-4 space-y-3">
          <input
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="w-full rounded-xl border border-glass-border bg-black/30 px-3 py-2 font-mono text-sm text-content-primary outline-none focus:border-tron/50"
            placeholder="Transaction ID after you broadcast elsewhere"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl border border-glass-border py-2 text-xs font-medium text-content-primary hover:bg-glass-highlight disabled:opacity-50"
          >
            Verify pasted transaction
          </button>
        </form>
      </details>
    </div>
  );
}
