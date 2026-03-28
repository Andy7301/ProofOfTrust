"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";
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
import {
  requestAmountDisplay,
  requestDescription,
  requestTargetLine
} from "@/lib/request-display";
import { describeX402Payment } from "@/lib/x402-payment-hints";

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-content-muted">{title}</h3>
      <div className="mt-3 text-sm text-content-primary">{children}</div>
    </div>
  );
}

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

  const x402Hint = useMemo(
    () => (payment ? describeX402Payment(payment) : null),
    [payment]
  );

  const timeline = useMemo(() => {
    if (!request) return [];
    const events: { title: string; subtitle: string; meta: string; state: "complete" | "active" | "pending" }[] =
      [
        {
          title: "Submitted",
          subtitle: "We received your request.",
          meta: "done",
          state: "complete"
        },
        {
          title: "Review",
          subtitle: request.aiExtractedData ? "Automated checks complete." : "In progress…",
          meta: request.aiExtractedData ? "done" : "pending",
          state: request.aiExtractedData ? "complete" : "active"
        },
        {
          title: "Decision",
          subtitle: approval ? approval.decision : "Waiting…",
          meta: approval ? "done" : "pending",
          state: approval ? "complete" : request.status === "AI_VERIFIED" ? "active" : "pending"
        },
        {
          title: "Payment",
          subtitle: payment?.txHash
            ? `Confirmed · ${payment.txHash.slice(0, 10)}…`
            : payment
              ? "Processing"
              : "Not started",
          meta: payment ? "done" : "—",
          state:
            request.status === "X402_PENDING" ? "active" : payment ? "complete" : "pending"
        },
        {
          title: "Balance",
          subtitle: debt ? `Open · $${debt.amount}` : "No balance for this request",
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

  const ai = request.aiExtractedData;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-xs text-solana hover:underline">
          ← Dashboard
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-content-primary">Request</h1>
          <StatusBadge status={request.status} />
        </div>
        <p className="mt-2 text-sm text-content-muted">{requestDescription(request)}</p>
        <p className="font-mono text-xs text-content-faint">{requestTargetLine(request)}</p>
        {request.filecoinAudit ? (
          <p className="mt-2 text-xs text-emerald-200/90">
            Verified settlement · ${requestAmountDisplay(request)} charged
          </p>
        ) : null}
      </div>

      <Timeline events={timeline} />

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="What we understood">
          {ai ? (
            <dl className="space-y-2 text-content-muted">
              <div>
                <dt className="text-content-faint">Service</dt>
                <dd>{ai.merchantOrService}</dd>
              </div>
              <div>
                <dt className="text-content-faint">Amount</dt>
                <dd>${ai.claimedAmount}</dd>
              </div>
              <div>
                <dt className="text-content-faint">Category</dt>
                <dd>{ai.category}</dd>
              </div>
              <div>
                <dt className="text-content-faint">Confidence</dt>
                <dd>{Math.round(ai.confidence * 100)}%</dd>
              </div>
              {ai.extractedJustification ? (
                <div>
                  <dt className="text-content-faint">Notes</dt>
                  <dd className="text-xs leading-relaxed">{ai.extractedJustification}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-content-muted">Review is still running.</p>
          )}
        </InfoCard>

        <InfoCard title="Decision">
          {approval ? (
            <div className="space-y-2">
              <p className="font-medium">{approval.decision}</p>
              {approval.reasons.length > 0 ? (
                <ul className="list-inside list-disc text-xs text-content-muted">
                  {approval.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="text-content-muted">No decision yet.</p>
          )}
        </InfoCard>
      </div>

      {request.auditPieceCid ? (
        <InfoCard title="Settlement record">
          {request.filecoinAudit ? (
            <dl className="space-y-1.5 text-content-muted">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-content-faint">Status</span>
                <span>{request.filecoinAudit.paid ? "Paid" : "Recorded"}</span>
              </div>
              {request.filecoinAudit.solanaTx ? (
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-content-faint">Payment</span>
                  <TxExplorerLink
                    label={`${request.filecoinAudit.solanaTx.slice(0, 14)}…`}
                    url={solanaTxExplorerUrl(request.filecoinAudit.solanaTx)}
                    mono
                  />
                </div>
              ) : null}
              <div className="pt-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-content-faint">Filecoin · Piece CID</p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-content-muted">{request.auditPieceCid}</p>
              </div>
            </dl>
          ) : (
            <p className="text-content-muted">We’re confirming this settlement. Check back shortly.</p>
          )}
        </InfoCard>
      ) : null}

      {payment ? (
        <div className="space-y-2">
          {x402Hint?.isMock ? (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
              <p className="font-medium">Payment not finalized on-chain yet</p>
              <p className="mt-1 text-xs text-amber-100/80">
                This request doesn’t have a confirmed on-network payment. Try again later or contact support if it
                persists.
              </p>
            </div>
          ) : payment.txHash ? (
            <p className="text-sm text-emerald-200/90">
              Solana payment:{" "}
              <TxExplorerLink
                label={payment.txHash}
                url={solanaTxExplorerUrl(payment.txHash)}
                mono
              />
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-content-muted">No payment for this request yet.</p>
      )}

      {debt && debt.status === "OPEN" ? (
        <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <p className="text-sm text-content-primary">
            Amount to repay: <span className="font-semibold">${debt.amount}</span>
          </p>
          <Link
            href={`/repay/${debt.id}`}
            className="rounded-lg bg-tron px-3 py-1.5 text-xs font-semibold text-cosmic"
          >
            Repay
          </Link>
        </div>
      ) : null}
    </div>
  );
}
