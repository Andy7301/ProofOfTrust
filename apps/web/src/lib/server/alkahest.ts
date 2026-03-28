import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { isMockAlkahest, serverEnv } from "./env";

/** Lightweight health signal for Alkahest / Base Sepolia (no contract calls in MVP). */
export async function optionalAlkahestRef(): Promise<string | undefined> {
  if (isMockAlkahest()) return undefined;
  const pk = serverEnv.alkahestPrivateKey;
  const rpc = serverEnv.alkahestRpcUrl;
  if (!pk || !rpc) return undefined;

  try {
    const account = privateKeyToAccount(pk);
    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpc)
    });
    const chainId = await client.getChainId();
    return `alkahest:base-sepolia:${chainId}:${account.address}`;
  } catch {
    return undefined;
  }
}
