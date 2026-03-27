"use client";

import Link from "next/link";
import { JsonPanel } from "@/components/ui/json-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getApprovalForRequest,
  getDebtForRequest,
  getPaymentForRequest,
  useMockStore
} from "@/lib/mock-store";

export default function AdminPage() {
  const { state } = useMockStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-content-primary">Admin / demo timeline</h1>
        <p className="mt-1 text-sm text-content-muted">
          Judge view: all simulated requests, decisions, payments, and debts.
        </p>
      </div>

      <section className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-content-faint">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Decision</th>
              <th className="px-4 py-3">x402</th>
              <th className="px-4 py-3">Debt</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {state.requests.map((r) => {
              const a = getApprovalForRequest(state.approvals, r.id);
              const p = getPaymentForRequest(state.payments, r.id);
              const d = getDebtForRequest(state.debts, r.id);
              return (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate text-content-primary">{r.description}</p>
                    <p className="truncate font-mono text-xs text-content-faint">{r.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-content-muted">{a?.decision ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-content-muted">
                    {p?.txHash?.slice(0, 12) ?? "—"}…
                  </td>
                  <td className="px-4 py-3 text-content-muted">
                    {d ? `${d.status} $${d.amount}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/requests/${r.id}`} className="text-solana hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <JsonPanel title="Full mock state snapshot" payload={state} />
    </div>
  );
}
