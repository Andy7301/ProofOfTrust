"use client";

import Link from "next/link";
import type { PurchaseRequestWithFilecoin } from "@proof/domain";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { filecoinPieceDocsUrl } from "@/lib/explorer-links";
import { useMockStore } from "@/lib/mock-store";
import { requestAmountDisplay, requestDescriptionLine, requestTargetLine } from "@/lib/request-display";

const useMockClientUi = process.env.NEXT_PUBLIC_USE_MOCK_CLIENT === "1";

function filecoinBadge(r: PurchaseRequestWithFilecoin) {
  if (r.filecoinAudit) {
    return (
      <span className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
        Filecoin audit
      </span>
    );
  }
  if (r.auditPieceCid) {
    return (
      <span className="rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">
        Piece CID · fetch pending
      </span>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { state } = useMockStore();
  const user = state.user!;

  const withFilecoinData = state.requests.filter((r) => r.filecoinAudit);
  const withoutFilecoinData = state.requests.filter((r) => !r.filecoinAudit);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-content-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-content-muted">
          {useMockClientUi
            ? "In-browser mock mode — requests and Solana payments are faked locally (set NEXT_PUBLIC_USE_MOCK_CLIENT off to use the API + real x402)."
            : "Purchase activity is anchored on Filecoin when x402 completes: the API loads audit JSON from your request’s PieceCID (Synapse warm storage). User profile and debts still come from the app API."}
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wider text-content-muted">
              Filecoin audit trail
            </h2>
            <p className="mt-1 max-w-xl text-xs text-content-faint">
              Rows below show data read from warm-storage audit JSON when available.{" "}
              <a
                href={filecoinPieceDocsUrl()}
                className="text-solana underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Filecoin Onchain Cloud
              </a>
              .
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
          {withFilecoinData.length === 0 ? (
            <li className="py-6 text-center text-sm text-content-muted">
              No Filecoin-backed audits yet. Complete an x402 payment with Synapse configured to store a PieceCID on
              the request.
            </li>
          ) : (
            withFilecoinData.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-content-primary">{requestDescriptionLine(r)}</p>
                    {filecoinBadge(r)}
                  </div>
                  <p className="font-mono text-xs text-content-faint">{requestTargetLine(r)}</p>
                  <p className="mt-1 font-mono text-[11px] text-emerald-200/80">
                    {r.filecoinAudit?.pieceCid ?? r.auditPieceCid}
                  </p>
                  {r.filecoinAudit?.solanaTx ? (
                    <p className="mt-0.5 text-xs text-content-muted">Solana: {r.filecoinAudit.solanaTx.slice(0, 24)}…</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-content-muted">${requestAmountDisplay(r)}</span>
                  <StatusBadge status={r.status} />
                  <Link
                    href={`/requests/${r.id}`}
                    className="text-xs font-medium text-solana hover:underline"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {withoutFilecoinData.length > 0 ? (
        <section className="glass rounded-2xl p-5">
          <h2 className="text-sm font-medium uppercase tracking-wider text-content-muted">
            In progress / app record only
          </h2>
          <p className="mt-1 text-xs text-content-faint">
            These requests are not yet backed by a fetched Filecoin audit (pipeline in flight, mock mode, or Synapse
            not configured).
          </p>
          <ul className="mt-4 divide-y divide-white/10">
            {withoutFilecoinData.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-content-primary">{requestDescriptionLine(r)}</p>
                    {filecoinBadge(r)}
                  </div>
                  <p className="font-mono text-xs text-content-faint">{requestTargetLine(r)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  <Link href={`/requests/${r.id}`} className="text-xs font-medium text-solana hover:underline">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
