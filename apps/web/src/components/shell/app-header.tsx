"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMockStore } from "@/lib/mock-store";
import { clsx } from "clsx";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/requests/new", label: "New request" }
];

export function AppHeader() {
  const pathname = usePathname();
  const { state, disconnect } = useMockStore();
  const user = state.user;

  return (
    <header className="sticky top-0 z-50 border-b border-glass-border bg-cosmic/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/dashboard" className="text-sm font-semibold tracking-wide text-content-primary">
          ProofOfTrust
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-sm transition",
                pathname === item.href
                  ? "bg-glass-highlight text-content-primary"
                  : "text-content-muted hover:bg-white/5 hover:text-content-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden font-mono text-xs text-content-muted sm:inline">
                {user.tronAddress.slice(0, 6)}…{user.tronAddress.slice(-4)}
              </span>
              <button
                type="button"
                onClick={() => disconnect()}
                className="rounded-lg border border-glass-border px-2 py-1 text-xs text-content-muted transition hover:border-white/20 hover:text-content-primary"
              >
                Disconnect
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="rounded-lg bg-tron px-3 py-1.5 text-xs font-medium text-cosmic"
            >
              Connect
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
