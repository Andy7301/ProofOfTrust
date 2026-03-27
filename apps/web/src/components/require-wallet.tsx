"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMockStore } from "@/lib/mock-store";

export function RequireWallet({ children }: { children: React.ReactNode }) {
  const { state, ready } = useMockStore();
  const router = useRouter();
  const user = state.user;

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/");
    }
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-content-muted">
        Loading session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-content-muted">
        Redirecting to connect…
      </div>
    );
  }

  return children;
}
