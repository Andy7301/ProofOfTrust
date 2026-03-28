import type { PurchaseRequestWithFilecoin } from "@proof/domain";

/** Prefer Filecoin audit JSON when the server fetched it; otherwise fall back to the app DB row. */
export function requestDescription(r: PurchaseRequestWithFilecoin): string {
  return r.filecoinAudit?.description ?? r.description;
}

export function requestDescriptionLine(r: PurchaseRequestWithFilecoin, maxLen = 80): string {
  const text = requestDescription(r);
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

export function requestTargetLine(r: PurchaseRequestWithFilecoin): string {
  return r.filecoinAudit?.targetService ?? r.targetService;
}

export function requestAmountDisplay(r: PurchaseRequestWithFilecoin): number {
  return r.filecoinAudit?.amount ?? r.requestedAmount;
}
