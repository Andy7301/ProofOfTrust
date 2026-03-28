export type DecisionType = "APPROVED" | "REJECTED" | "MANUAL_REVIEW";

export type RequestStatus =
  | "PENDING"
  | "AI_VERIFIED"
  | "APPROVED"
  | "REJECTED"
  | "MANUAL_REVIEW"
  | "X402_PENDING"
  | "PAID"
  | "FAILED";

export type DebtStatus = "OPEN" | "REPAID" | "OVERDUE";

export type X402Status = "IDLE" | "CHALLENGE" | "PAID" | "FAILED";

export interface User {
  id: string;
  displayName: string;
  tronAddress: string;
  reputationScore: number;
  creditLimit: number;
  outstandingDebt: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiExtractedData {
  merchantOrService: string;
  claimedAmount: number;
  category: string;
  confidence: number;
  suspiciousFlags: string[];
  extractedJustification: string;
}

/** Audit JSON fetched from Filecoin (Synapse); attached by the API, not stored in the JSON DB. */
export interface FilecoinAuditRecord {
  pieceCid: string;
  kind?: string;
  requestId?: string;
  userId?: string;
  paid?: boolean;
  solanaTx?: string;
  amount?: number;
  targetService?: string;
  description?: string;
  x402Status?: string;
  resultPreview?: string;
  at?: string;
}

export interface PurchaseRequest {
  id: string;
  userId: string;
  description: string;
  targetService: string;
  requestedAmount: number;
  uploadedImageUrl?: string;
  aiExtractedData?: AiExtractedData;
  aiConfidence?: number;
  suspicionFlags: string[];
  status: RequestStatus;
  /** Optional Filecoin Onchain Cloud PieceCID (Synapse warm-storage audit JSON) */
  auditPieceCid?: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseRequestWithFilecoin = PurchaseRequest & {
  /** `null` = fetch failed; `undefined` = no piece CID or mock Filecoin. */
  filecoinAudit?: FilecoinAuditRecord | null;
};

export interface ApprovalDecision {
  id: string;
  requestId: string;
  decision: DecisionType;
  reasons: string[];
  trustScoreSnapshot: number;
  policySnapshot: Record<string, number>;
  createdAt: string;
}

export interface FrontedPayment {
  id: string;
  requestId: string;
  chain: "SOLANA";
  amount: number;
  x402Status: X402Status;
  txHash?: string;
  resultPayload?: string;
  createdAt: string;
}

export interface DebtRecord {
  id: string;
  userId: string;
  requestId: string;
  amount: number;
  status: DebtStatus;
  dueAt?: string;
  repaidAt?: string;
  tronRepaymentTxHash?: string;
  createdAt: string;
}

export type ReputationEventType =
  | "REPAYMENT_SUCCESS"
  | "DEFAULT"
  | "REQUEST_APPROVED"
  | "REQUEST_REJECTED";

export interface ReputationEvent {
  id: string;
  userId: string;
  eventType: ReputationEventType;
  delta: number;
  explanation: string;
  createdAt: string;
}
