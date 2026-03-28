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

export interface PurchaseRequest {
  id: string;
  userId: string;
  description: string;
  targetService: string;
  requestedAmount: number;
  uploadedImageUrl?: string;
  urgency: "NORMAL" | "HIGH" | "URGENT";
  aiExtractedData?: AiExtractedData;
  aiConfidence?: number;
  suspicionFlags: string[];
  status: RequestStatus;
  /** Optional Alkahest / EVM escrow attestation id or tx note */
  alkahestRef?: string;
  /** Optional Filecoin PieceCID after audit upload */
  auditPieceCid?: string;
  createdAt: string;
  updatedAt: string;
}

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
