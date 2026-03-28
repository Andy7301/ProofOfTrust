import { makeClient } from "alkahest-ts";
import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { isMockAlkahest, serverEnv } from "./env";

export type AlkahestPurchasePayload = {
  requestId: string;
  userId: string;
  paid: boolean;
  solanaTx?: string;
  amount: number;
  targetService: string;
  x402Status?: string;
  /** Short excerpt for attestation payload (keep small for gas) */
  resultPreview?: string;
};

/**
 * Writes a JSON payload to chain via Alkahest StringObligation on Base Sepolia (EAS attestation).
 * Returns EAS uid + tx hash for audit; on failure logs and returns undefined (purchase flow continues).
 */
export async function recordAlkahestPurchaseAttestation(
  payload: AlkahestPurchasePayload
): Promise<string | undefined> {
  if (isMockAlkahest()) return undefined;

  const pk = serverEnv.alkahestPrivateKey;
  const rpc = serverEnv.alkahestRpcUrl;
  if (!pk || !rpc) return undefined;

  try {
    const account = privateKeyToAccount(pk);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpc)
    });
    const client = makeClient(walletClient);
    const { hash, attested } = await client.stringObligation.doObligationJson({
      kind: "proof-of-trust/purchase",
      ...payload,
      at: new Date().toISOString()
    });
    const uid = attested?.uid;
    if (!uid) return `tx:${hash}`;
    return `eas:${uid}:tx:${hash}`;
  } catch (err) {
    console.error("[alkahest] recordAlkahestPurchaseAttestation failed", err);
    return undefined;
  }
}
