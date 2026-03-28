"use client";

import Link from "next/link";
import { WalletConnectCard } from "@/components/wallet-connect-card";
import { useMockStore } from "@/lib/mock-store";

export function LandingView() {
  const { state, ready } = useMockStore();
  const connected = ready && !!state.user;

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <section className="mx-auto w-full max-w-3xl text-center">
        <p className="text-xs tracking-[0.12em] text-content-muted">ProofOfTrust</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-content-primary">
          AI-native cross-chain expense concierge
        </h1>
        <p className="mt-3 text-content-muted">
          Access paid services on <span className="font-medium text-solana">Solana</span>, then settle on{" "}
          <span className="font-medium text-tron">TRON</span> when you&apos;re ready.
        </p>
        {connected ? (
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-xl bg-tron px-5 py-2.5 text-sm font-semibold text-cosmic transition hover:brightness-110"
          >
            Go to dashboard
          </Link>
        ) : null}
      </section>

      <WalletConnectCard />
    </main>
  );
}
