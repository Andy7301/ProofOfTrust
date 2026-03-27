"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BridgeRail } from "@/components/bridge-rail";
import { useMockStore } from "@/lib/mock-store";

export function WalletConnectCard() {
  const router = useRouter();
  const { connect, state } = useMockStore();
  const [busy, setBusy] = useState<"idle" | "connecting">("idle");

  const connected = !!state.user;

  const handleConnect = async () => {
    setBusy("connecting");
    await new Promise((r) => setTimeout(r, 600));
    connect(false);
    setBusy("idle");
    router.push("/dashboard");
  };

  const handleSimulated = async () => {
    setBusy("connecting");
    await new Promise((r) => setTimeout(r, 400));
    connect(true);
    setBusy("idle");
    router.push("/dashboard");
  };

  return (
    <section className="glass-strong relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl p-6">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-ai-dim blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-solana-dim blur-3xl"
        aria-hidden
      />

      <p className="text-xs font-medium tracking-wide text-content-muted">Step 1 of 5</p>
      <h2 className="mt-2 text-2xl font-semibold text-content-primary">Connect your TRON wallet</h2>
      <p className="mt-2 text-sm text-content-muted">
        Link a wallet identity. We use this address for trust scoring, debt tracking, and repayment
        verification.
      </p>

      <div className="mt-6 flex flex-col items-center gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-content-faint">
          Cross-chain flow
        </p>
        <BridgeRail />
        <div className="flex w-full max-w-md justify-between text-[11px] text-content-faint">
          <span className="text-tron">TRON · repay</span>
          <span className="text-solana">Solana · x402</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={handleConnect}
          disabled={busy !== "idle" || connected}
          className="w-full rounded-xl bg-tron px-4 py-2.5 text-sm font-semibold text-cosmic transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-content-faint disabled:text-content-muted"
        >
          {connected
            ? "Connected"
            : busy === "connecting"
              ? "Connecting…"
              : "Connect TronLink (simulated)"}
        </button>
        <button
          type="button"
          onClick={handleSimulated}
          disabled={busy !== "idle" || connected}
          className="w-full rounded-xl border border-glass-border bg-glass-bg px-4 py-2.5 text-sm text-content-primary transition hover:border-white/20 hover:bg-glass-highlight disabled:opacity-50"
        >
          Continue with simulated wallet
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-glass-border bg-black/30 p-3 font-mono text-xs text-content-muted backdrop-blur-sm">
        <span className="text-content-faint">Status</span>{" "}
        <span className="text-content-primary">
          {connected ? `connected · ${state.user!.tronAddress.slice(0, 6)}…` : "not connected"}
        </span>
      </div>
    </section>
  );
}
