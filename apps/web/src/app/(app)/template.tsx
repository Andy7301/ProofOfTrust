"use client";

import { RequireWallet } from "@/components/require-wallet";

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <RequireWallet>{children}</RequireWallet>;
}
