"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { perRequestMaxUsd } from "@/lib/per-request-max";
import { useMockStore } from "@/lib/mock-store";

export default function NewRequestPage() {
  const router = useRouter();
  const { createRequest, state } = useMockStore();
  const maxPerRequest = state.user ? perRequestMaxUsd(state.user) : null;
  const [description, setDescription] = useState("");
  const [targetService, setTargetService] = useState("http://localhost:3000/api/x402/demo");

  useEffect(() => {
    setTargetService(`${window.location.origin}/api/x402/demo`);
  }, []);
  const [amount, setAmount] = useState("18");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = Number(amount);
    if (!description.trim() || !targetService.trim() || Number.isNaN(n) || n <= 0) {
      setError("Fill all fields with a valid amount.");
      return;
    }
    if (maxPerRequest != null && maxPerRequest <= 0) {
      setError("No available credit for new requests. Repay an open balance first.");
      return;
    }
    if (maxPerRequest != null && n > maxPerRequest) {
      setError(`Maximum for one request is $${maxPerRequest}.`);
      return;
    }
    setSubmitting(true);
    try {
      const id = await createRequest({
        description: description.trim(),
        targetService: targetService.trim(),
        requestedAmount: n
      });
      router.push(`/requests/${id}`);
    } catch {
      setError("Could not create request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/dashboard" className="text-xs text-solana hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-content-primary">New purchase request</h1>
        <p className="mt-1 text-sm text-content-muted">
          After you submit, we review the request and proceed to payment when approved.
        </p>
      </div>

      <form onSubmit={onSubmit} className="glass space-y-4 rounded-2xl p-6">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-content-muted">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-glass-border bg-black/30 px-3 py-2 text-sm text-content-primary outline-none focus:border-solana/50"
            placeholder="What do you need the paid API for?"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-content-muted">Target service / endpoint</span>
          <input
            value={targetService}
            onChange={(e) => setTargetService(e.target.value)}
            className="w-full rounded-xl border border-glass-border bg-black/30 px-3 py-2 font-mono text-sm text-content-primary outline-none focus:border-solana/50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-content-muted">Expected cost (USD)</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min={1}
            max={maxPerRequest != null && maxPerRequest > 0 ? maxPerRequest : undefined}
            step={1}
            className="w-full rounded-xl border border-glass-border bg-black/30 px-3 py-2 text-sm text-content-primary outline-none focus:border-solana/50"
          />
          {maxPerRequest != null ? (
            <p className="text-xs text-content-faint">
              Maximum per request: <span className="text-content-muted">${maxPerRequest}</span>
              {maxPerRequest <= 0 ? " — repay outstanding balance to free capacity." : ""}
            </p>
          ) : null}
        </label>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-tron px-4 py-2.5 text-sm font-semibold text-cosmic transition hover:brightness-110 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </div>
  );
}
