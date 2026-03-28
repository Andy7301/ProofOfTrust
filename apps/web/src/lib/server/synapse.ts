/**
 * ProofOfTrust audit blobs on Filecoin Onchain Cloud (warm storage) via Synapse SDK.
 *
 * @see https://docs.filecoin.cloud/getting-started/
 * @see https://filecoin.cloud/
 * @see https://github.com/FIL-Builders/fs-upload-dapp (reference app)
 *
 * Requires Calibration tFIL (gas) + test USDFC (storage lockup). Filecoin Pin is an
 * alternate path documented at https://docs.filecoin.io/builder-cookbook/filecoin-pin — this module uses Synapse only.
 */
import { METADATA_KEYS, Synapse, calibration } from "@filoz/synapse-sdk";
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
  /** Non-sensitive summary for the audit JSON */
  resultPreview?: string;
};

const SYNAPSE_SOURCE = "proof-of-trust";

/** @see https://docs.filecoin.cloud/getting-started/ — minimum upload size per piece */
const MIN_UPLOAD_BYTES = 127;

/** Extra epochs beyond SDK default so on-chain lockup clears rounding (InsufficientLockupFunds). */
const PREPARE_BUFFER_EPOCHS = 96n;
const PREPARE_BUFFER_EPOCHS_RETRY = 512n;

function isInsufficientLockupFunds(err: unknown): boolean {
  const s = err instanceof Error ? `${err.message}\n${String((err as Error).cause)}` : String(err);
  return /InsufficientLockupFunds|Insufficient lockup/i.test(s);
}

function encodeAuditJsonMinSize(record: Record<string, unknown>): Uint8Array {
  let json = JSON.stringify(record);
  let bytes = new TextEncoder().encode(json);
  while (bytes.length < MIN_UPLOAD_BYTES) {
    json += " ";
    bytes = new TextEncoder().encode(json);
  }
  return bytes;
}

async function prepareFund(
  synapse: ReturnType<typeof Synapse.create>,
  dataSize: bigint,
  bufferEpochs: bigint
) {
  const prepared = await synapse.storage.prepare({ dataSize, bufferEpochs });
  if (prepared.transaction) {
    await prepared.transaction.execute();
  }
}

/**
 * Uploads a JSON audit record through the same flow as the Onchain Cloud quick start:
 * `Synapse.create` → `storage.prepare` → `storage.upload` (here with `copies: 1` to reduce lockup).
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

    const record = {
      kind: "proof-of-trust/audit",
      ...payload,
      at: new Date().toISOString()
    };
    const bytes = encodeAuditJsonMinSize(record);
    const dataSize = BigInt(bytes.length);

    await prepareFund(synapse, dataSize, PREPARE_BUFFER_EPOCHS);

    const pieceMetadata: Record<string, string> = {
      requestId: payload.requestId,
      userId: payload.userId
    };

    const datasetMeta: Record<string, string> = {
      [METADATA_KEYS.SOURCE]: SYNAPSE_SOURCE,
      product: "proof-of-trust",
      recordType: "purchase-audit"
    };

    let result: Awaited<ReturnType<(typeof synapse.storage)["upload"]>>;
    try {
      result = await synapse.storage.upload(bytes, {
        copies: 1,
        withCDN: false,
        metadata: datasetMeta,
        pieceMetadata
      });
    } catch (first) {
      if (!isInsufficientLockupFunds(first)) throw first;
      await prepareFund(synapse, dataSize, PREPARE_BUFFER_EPOCHS_RETRY);
      result = await synapse.storage.upload(bytes, {
        copies: 1,
        withCDN: false,
        metadata: datasetMeta,
        pieceMetadata
      });
    }

    const cid = String(result.pieceCid);
    if (result.copies.length === 0) {
      console.error("[synapse] upload had no committed copies", { requestId: payload.requestId, cid });
      return undefined;
    }
    if (!result.complete) {
      console.warn("[synapse] upload incomplete (partial copies)", {
        requestId: payload.requestId,
        cid,
        failedAttempts: result.failedAttempts.length
      });
    }
    return cid;
  } catch (err) {
    if (isInsufficientLockupFunds(err)) {
      console.warn(
        "[synapse] audit upload skipped: add test USDFC + tFIL on Calibration for this wallet (https://docs.filecoin.cloud/getting-started/)."
      );
    } else {
      console.error("[synapse] uploadPurchaseAuditToFilecoin failed", err);
    }
    return undefined;
  }
}
