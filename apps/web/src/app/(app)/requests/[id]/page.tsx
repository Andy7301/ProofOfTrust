"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { JsonPanel } from "@/components/ui/json-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { Timeline } from "@/components/ui/timeline";
import { TxExplorerLink } from "@/components/tx-explorer-link";
import { solanaTxExplorerUrl } from "@/lib/explorer-links";
import {
  getApprovalForRequest,
  getDebtForRequest,
  getPaymentForRequest,
  useMockStore
} from "@/lib/mock-store";

export default function RequestDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { state } = useMockStore();

  const request = state.requests.find((r) => r.id === id);
  const approval = useMemo(
    () => (request ? getApprovalForRequest(state.approvals, request.id) : undefined),
    [state.approvals, request]
  );
  const payment = useMemo(
    () => (request ? getPaymentForRequest(state.payments, request.id) : undefined),
    [state.payments, request]
  );
  const debt = useMemo(
    () => (request ? getDebtForRequest(state.debts, request.id) : undefined),
    [state.debts, request]
  );

  const timeline = useMemo(() => {
    if (!request) return [];
    const events: { title: string; subtitle: string; meta: string; state: "complete" | "active" | "pending" }[] =
      [
        {
          title: "Submitted",
          subtitle: "Purchase request recorded.",
          meta: "done",
          state: "complete"
        },
        {
          title: "AI verification",
          subtitle: request.aiExtractedData ? "Structured extraction complete." : "Waiting…",
          meta: request.aiExtractedData ? "done" : "pending",
          state: request.aiExtractedData ? "complete" : "active"
        },
        {
          title: "Policy decision",
          subtitle: approval ? `${approval.decision}` : "Waiting…",
          meta: approval ? "done" : "pending",
          state: approval
            ? "complete"
            : request.status === "AI_VERIFIED"
              ? "active"
              : "pending"
        },
        {
          title: "Solana x402",
          subtitle: payment?.txHash
            ? `Paid · ${payment.txHash.slice(0, 12)}…`
            : payment
              ? "Paid (no on-chain signature recorded)"
              : "Not started or skipped",
          meta: payment ? "done" : "—",
          state:
            request.status === "X402_PENDING"
              ? "active"
              : payment
                ? "complete"
                : "pending"
        },
        {
          title: "Debt ledger",
          subtitle: debt ? `Open · $${debt.amount}` : "No debt (rejected / manual)",
          meta: debt ? "recorded" : "—",
          state: debt ? "complete" : "pending"
        }
      ];
    return events;
  }, [request, approval, payment, debt]);

  if (!request) {
    return (
      <div className="text-center text-content-muted">
        <p>Request not found.</p>
        <Link href="/dashboard" className="mt-2 inline-block text-solana hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-xs text-solana hover:underline">
          ← Dashboard
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-content-primary">Request detail</h1>
          <StatusBadge status={request.status} />
        </div>
        <p className="mt-2 text-sm text-content-muted">{request.description}</p>
        <p className="font-mono text-xs text-content-faint">{request.targetService}</p>
      </div>

      <Timeline events={timeline} />

      <div className="grid gap-4 lg:grid-cols-2">
        <JsonPanel title="AI extracted" payload={request.aiExtractedData ?? {}} />
        <JsonPanel
          title="Approval decision"
          payload={
            approval ?? {
              pending: true,
              hint: "Runs after AI step in simulation."
            }
          }
        />
      </div>

      {payment ? (
        <div className="space-y-2">
          {payment.txHash ? (
            <p className="text-sm text-content-muted">
              On-chain (Solana):{" "}
              <TxExplorerLink
                label={payment.txHash}
                url={solanaTxExplorerUrl(payment.txHash)}
                mono
              />
            </p>
          ) : null}
          <JsonPanel title="x402 payment" payload={payment} />
        </div>
      ) : (
        <p className="text-sm text-content-muted">No x402 payment object yet (rejected or pending).</p>
      )}

      {debt && debt.status === "OPEN" ? (
        <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <p className="text-sm text-content-primary">
            Outstanding debt: <span className="font-semibold">${debt.amount}</span>
          </p>
          <Link
            href={`/repay/${debt.id}`}
            className="rounded-lg bg-tron px-3 py-1.5 text-xs font-semibold text-cosmic"
          >
            Repay on TRON
          </Link>
        </div>
      ) : null}
    </div>
  );
}
