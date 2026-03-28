import type { FilecoinAuditRecord, PurchaseRequest, PurchaseRequestWithFilecoin } from "@proof/domain";
import { downloadPurchaseAuditFromFilecoin } from "./synapse";

const cache = new Map<string, { at: number; value: FilecoinAuditRecord | null }>();
const TTL_MS = 60_000;

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function bool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

function recordFromJson(pieceCid: string, raw: Record<string, unknown>): FilecoinAuditRecord {
  return {
    pieceCid,
    kind: str(raw.kind),
    requestId: str(raw.requestId),
    userId: str(raw.userId),
    paid: bool(raw.paid),
    solanaTx: str(raw.solanaTx),
    amount: num(raw.amount),
    targetService: str(raw.targetService),
    description: str(raw.description),
    x402Status: str(raw.x402Status),
    resultPreview: str(raw.resultPreview),
    at: str(raw.at)
  };
}

async function fetchAuditForPiece(pieceCid: string): Promise<FilecoinAuditRecord | null> {
  const now = Date.now();
  const hit = cache.get(pieceCid);
  if (hit && now - hit.at < TTL_MS) return hit.value;

  const raw = await downloadPurchaseAuditFromFilecoin(pieceCid);
  let value: FilecoinAuditRecord | null = null;
  if (raw && typeof raw === "object") {
    value = recordFromJson(pieceCid, raw);
  }
  cache.set(pieceCid, { at: now, value });
  return value;
}

export async function enrichRequestWithFilecoinAudit(
  request: PurchaseRequest
): Promise<PurchaseRequestWithFilecoin> {
  const cid = request.auditPieceCid?.trim();
  if (!cid) {
    return { ...request, filecoinAudit: undefined };
  }
  const filecoinAudit = await fetchAuditForPiece(cid);
  return { ...request, filecoinAudit };
}

export async function enrichRequestsWithFilecoinAudits(
  requests: PurchaseRequest[]
): Promise<PurchaseRequestWithFilecoin[]> {
  return Promise.all(requests.map((r) => enrichRequestWithFilecoinAudit(r)));
}
