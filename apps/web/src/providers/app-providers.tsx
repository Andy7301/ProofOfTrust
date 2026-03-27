"use client";

import { MockStoreProvider } from "@/lib/mock-store";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return <MockStoreProvider>{children}</MockStoreProvider>;
}
