"use client";

import Link from "next/link";
import type { PurchaseRequestWithFilecoin } from "@proof/domain";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { perRequestMaxUsd } from "@/lib/per-request-max";
import { useMockStore } from "@/lib/mock-store";
import { requestAmountDisplay, requestDescriptionLine, requestTargetLine } from "@/lib/request-display";

function statusBadge(r: PurchaseRequestWithFilecoin) {
  if (r.filecoinAudit) {
    return (
      <span className="rounded-md border border-emerald-500/35 bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200/95">
        Verified
      </span>
    );
  }
  if (r.auditPieceCid) {
    return (
      <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">
        Confirming
      </span>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { state } = useMockStore();
  const user = state.user!;
  const maxPerRequest = perRequestMaxUsd(user);

  const settled = state.requests.filter((r) => r.filecoinAudit);
  const inProgress = state.requests.filter((r) => !r.filecoinAudit);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-content-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-content-muted">
          Your trust profile, requests, and open balances in one place.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Reputation"
          value={`${Math.round(user.reputationScore * 100)}%`}
          helper="Trust score"
        />
        <StatCard label="Credit limit" value={`$${user.creditLimit}`} helper="Total facility" />
        <StatCard label="Max per request" value={`$${maxPerRequest}`} helper="Policy and available credit" />
        <StatCard label="Outstanding" value={`$${user.outstandingDebt}`} helper="To repay on TRON" />
        <StatCard label="Open balances" value={`${state.debts.filter((d) => d.status === "OPEN").length}`} helper="Active" />
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wider text-content-muted">Settled activity</h2>
            <p className="mt-1 max-w-md text-xs text-content-faint">
              Fully completed requests with a verified settlement record.
            </p>
          </div>
          <Link
            href="/requests/new"
            className="rounded-lg bg-solana px-3 py-1.5 text-xs font-semibold text-cosmic transition hover:brightness-110"
          >
            New request
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-white/10">
          {settled.length === 0 ? (
            <li className="py-8 text-center text-sm text-content-muted">
              Nothing here yet. When a request is paid through, it will show up as verified.
            </li>
          ) : (
            settled.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-content-primary">{requestDescriptionLine(r)}</p>
                    {statusBadge(r)}
                  </div>
                  <p className="truncate font-mono text-xs text-content-faint">{requestTargetLine(r)}</p>
                  {r.filecoinAudit?.solanaTx ? (
                    <p className="mt-1 text-xs text-content-muted">Payment recorded on Solana.</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-content-muted">${requestAmountDisplay(r)}</span>
                  <StatusBadge status={r.status} />
                  <Link href={`/requests/${r.id}`} className="text-xs font-medium text-solana hover:underline">
                    Details
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {inProgress.length > 0 ? (
        <section className="glass rounded-2xl p-5">
          <h2 className="text-sm font-medium uppercase tracking-wider text-content-muted">In progress</h2>
          <p className="mt-1 text-xs text-content-faint">Requests still moving through review or payment.</p>
          <ul className="mt-4 divide-y divide-white/10">
            {inProgress.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-content-primary">{requestDescriptionLine(r)}</p>
                    {statusBadge(r)}
                  </div>
                  <p className="truncate font-mono text-xs text-content-faint">{requestTargetLine(r)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={r.status} />
                  <Link href={`/requests/${r.id}`} className="text-xs font-medium text-solana hover:underline">
                    Details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="glass rounded-2xl p-5">
        <h2 className="text-sm font-medium uppercase tracking-wider text-content-muted">Balances</h2>
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
