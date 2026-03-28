"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BridgeRail } from "@/components/bridge-rail";
import { useMockStore } from "@/lib/mock-store";

export function WalletConnectCard() {
  const router = useRouter();
  const { connect, state } = useMockStore();
  const [busy, setBusy] = useState<"idle" | "connecting">("idle");
  const [error, setError] = useState<string | null>(null);

  const connected = !!state.user;

  const handleConnectTronLink = async () => {
    setError(null);
    setBusy("connecting");
    try {
      await connect();
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("idle");
    }
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

      <h2 className="text-2xl font-semibold text-content-primary">Connect your wallet</h2>
      <p className="mt-2 text-sm text-content-muted">
        Use TronLink to sign in. Your address is used for your trust profile, activity, and TRX repayments.
      </p>

      <div className="mt-6 flex flex-col items-center gap-2">
        <BridgeRail />
        <p className="text-center text-[11px] text-content-faint">Repay on TRON · pay vendors via Solana</p>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => void handleConnectTronLink()}
          disabled={busy !== "idle" || connected}
          className="w-full rounded-xl bg-tron px-4 py-2.5 text-sm font-semibold text-cosmic transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-content-faint disabled:text-content-muted"
        >
          {connected
            ? "Connected"
            : busy === "connecting"
              ? "Connecting…"
              : "Connect with TronLink"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-5 rounded-xl border border-glass-border bg-black/30 p-3 text-xs text-content-muted backdrop-blur-sm">
        <span className="text-content-faint">Signed in as</span>{" "}
        <span className="font-mono text-content-primary">
          {connected ? `${state.user!.tronAddress.slice(0, 8)}…${state.user!.tronAddress.slice(-6)}` : "—"}
        </span>
      </div>
    </section>
  );
}
