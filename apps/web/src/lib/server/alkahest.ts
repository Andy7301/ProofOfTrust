import { makeClient } from "alkahest-ts";
import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { isMockAlkahest, serverEnv } from "./env";

let warnedEthSepoliaInfura = false;

/** Infura `sepolia.infura.io` is Ethereum Sepolia; Alkahest uses Base Sepolia (`base-sepolia.infura.io`). */
function warnIfEthereumSepoliaInfuraRpc(rpc: string) {
  if (warnedEthSepoliaInfura) return;
  try {
    const host = new URL(rpc).hostname.toLowerCase();
    if (host === "sepolia.infura.io") {
      warnedEthSepoliaInfura = true;
      console.warn(
        "[alkahest] ALKAHEST_RPC_URL points at Ethereum Sepolia (sepolia.infura.io). Use Base Sepolia: https://base-sepolia.infura.io/v3/<PROJECT_ID>"
      );
    }
  } catch {
    /* ignore invalid URL */
  }
}

export type AlkahestPurchasePayload = {
  requestId: string;
  userId: string;
  paid: boolean;
  solanaTx?: string;
  amount: number;
  targetService: string;
  x402Status?: string;
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
  warnIfEthereumSepoliaInfuraRpc(rpc);

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
    const text = err instanceof Error ? err.message : String(err);
    if (/insufficient funds|exceeds the balance/i.test(text)) {
      console.warn(
        "[alkahest] attestation skipped: fund `ALKAHEST_PRIVATE_KEY` wallet with Base Sepolia ETH for gas."
      );
    } else {
      console.error("[alkahest] recordAlkahestPurchaseAttestation failed", err);
    }
    return undefined;
  }
}
