import { loadDb } from "@/lib/server/db";
import { isMockAlkahest, serverEnv } from "@/lib/server/env";
import { createPublicClient, formatEther, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    await loadDb();
    const body: Record<string, unknown> = { ok: true, db: "reachable" };

    /** Helps verify Base Sepolia ETH is on the same address as `ALKAHEST_PRIVATE_KEY` (dev only). */
    if (process.env.NODE_ENV === "development" && !isMockAlkahest() && serverEnv.alkahestPrivateKey) {
      const rpc = serverEnv.alkahestRpcUrl ?? "https://sepolia.base.org";
      const account = privateKeyToAccount(serverEnv.alkahestPrivateKey);
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(rpc)
      });
      const balance = await publicClient.getBalance({ address: account.address });
      body.alkahestDev = {
        address: account.address,
        balanceEth: formatEther(balance),
        rpcHost: (() => {
          try {
            return new URL(rpc).host;
          } catch {
            return "invalid-url";
          }
        })(),
        hint:
          balance === 0n
            ? "Fund THIS address on Base Sepolia (chain 84532), not Ethereum Sepolia — see https://sepolia.basescan.org"
            : undefined
      };
    }

    return NextResponse.json(body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
