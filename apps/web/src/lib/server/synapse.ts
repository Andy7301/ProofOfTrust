import { Synapse, calibration } from "@filoz/synapse-sdk";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { isMockFilecoinAudit, serverEnv } from "./env";

export type FilecoinAuditPayload = {
  requestId: string;
  userId: string;
  paid: boolean;
  solanaTx?: string;
  amount: number;
  targetService: string;
  description: string;
  x402Status?: string;
  /** Included in warm-storage piece metadata */
  resultPreview?: string;
};

const SYNAPSE_SOURCE = "proof-of-trust";

/**
 * Uploads a JSON audit blob via Synapse warm storage on Filecoin Calibration.
 * Funds payment rails via storage.prepare() when needed (requires tFIL + USDFC on the wallet).
 * Returns PieceCID string; on failure logs and returns undefined.
 */
export async function uploadPurchaseAuditToFilecoin(payload: FilecoinAuditPayload): Promise<string | undefined> {
  if (isMockFilecoinAudit()) return undefined;

  const pk = serverEnv.synapsePrivateKey;
  const rpc = serverEnv.filecoinCalibrationRpcUrl;
  if (!pk || !rpc) return undefined;

  try {
    const account = privateKeyToAccount(pk);
    const synapse = Synapse.create({
      account,
      chain: calibration,
      transport: http(rpc),
      source: SYNAPSE_SOURCE,
      withCDN: false
    });

    const body = JSON.stringify({
      kind: "proof-of-trust/audit",
      ...payload,
      at: new Date().toISOString()
    });
    const bytes = new TextEncoder().encode(body);
    const dataSize = BigInt(bytes.length);

    const contexts = await synapse.storage.createContexts({ copies: 1, withCDN: false });
    const ctx = contexts[0];
    if (!ctx) throw new Error("Synapse: no storage context (copies:1)");
    const prepared = await synapse.storage.prepare({ context: ctx, dataSize });
    if (prepared.transaction) {
      await prepared.transaction.execute();
    }

    // Use context.upload — avoids StorageManager rejecting `contexts` + `withCDN` (even `withCDN: false`).
    const result = await ctx.upload(bytes, {
      pieceMetadata: {
        requestId: payload.requestId,
        userId: payload.userId
      }
    });

    const cid = String(result.pieceCid);
    if (result.copies.length === 0) {
      console.error("[synapse] upload had no committed copies", { requestId: payload.requestId, cid });
      return undefined;
    }
    return cid;
  } catch (err) {
    console.error("[synapse] uploadPurchaseAuditToFilecoin failed", err);
    return undefined;
  }
}
