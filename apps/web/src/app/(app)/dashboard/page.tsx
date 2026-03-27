"use client";

import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useMockStore } from "@/lib/mock-store";

export default function DashboardPage() {
  const { state } = useMockStore();
  const user = state.user!;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-content-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-content-muted">
          Trust, credit, and active obligations — simulated for demo.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Reputation"
          value={`${Math.round(user.reputationScore * 100)}%`}
          helper="0–1 trust score"
        />
        <StatCard label="Credit limit" value={`$${user.creditLimit}`} helper="Policy cap" />
        <StatCard label="Outstanding debt" value={`$${user.outstandingDebt}`} helper="TRON repayment" />
        <StatCard label="Open debts" value={`${state.debts.filter((d) => d.status === "OPEN").length}`} helper="Records" />
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-content-muted">
            Purchase requests
          </h2>
          <Link
            href="/requests/new"
            className="rounded-lg bg-solana px-3 py-1.5 text-xs font-semibold text-cosmic transition hover:brightness-110"
          >
            New request
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-white/10">
          {state.requests.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-medium text-content-primary">{r.description.slice(0, 80)}</p>
                <p className="font-mono text-xs text-content-faint">{r.targetService}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={r.status} />
                <Link
                  href={`/requests/${r.id}`}
                  className="text-xs font-medium text-solana hover:underline"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="text-sm font-medium uppercase tracking-wider text-content-muted">Debts</h2>
        <ul className="mt-4 divide-y divide-white/10">
          {state.debts.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm text-content-primary">${d.amount}</p>
                <p className="text-xs text-content-faint">
                  {d.status === "OPEN" ? `Due ${d.dueAt?.slice(0, 10) ?? "—"}` : `Repaid ${d.repaidAt?.slice(0, 10)}`}
                </p>
              </div>
              {d.status === "OPEN" ? (
                <Link
                  href={`/repay/${d.id}`}
                  className="rounded-lg border border-tron/50 px-3 py-1 text-xs font-medium text-tron hover:bg-tron/10"
                >
                  Repay
                </Link>
              ) : (
                <span className="font-mono text-xs text-content-muted">{d.tronRepaymentTxHash}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
