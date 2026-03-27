export type DecisionType = "APPROVED" | "REJECTED" | "MANUAL_REVIEW";

export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MANUAL_REVIEW"
  | "PAID"
  | "FAILED";

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
