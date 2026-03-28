import type { ReputationEvent, User } from "@proof/domain";
import { genId, nowIso } from "./ids";

export function bumpOnApproval(user: User): User {
  return {
    ...user,
    updatedAt: nowIso()
  };
}

export function eventApproved(userId: string): ReputationEvent {
  return {
    id: genId("rep"),
    userId,
    eventType: "REQUEST_APPROVED",
    delta: 0,
    explanation: "Request approved for fronting.",
    createdAt: nowIso()
  };
}

export function eventRejected(userId: string): ReputationEvent {
  return {
    id: genId("rep"),
    userId,
    eventType: "REQUEST_REJECTED",
    delta: -0.01,
    explanation: "Request rejected.",
    createdAt: nowIso()
  };
}

export function eventRepaid(userId: string, amount: number): ReputationEvent {
  return {
    id: genId("rep"),
    userId,
    eventType: "REPAYMENT_SUCCESS",
    delta: 0.02,
    explanation: `Repayment recorded (${amount}).`,
    createdAt: nowIso()
  };
}

export function applyRepayment(user: User, amount: number): User {
  const outstandingDebt = Math.max(0, user.outstandingDebt - amount);
  const reputationScore = Math.min(1, user.reputationScore + 0.02);
  return {
    ...user,
    outstandingDebt,
    reputationScore,
    updatedAt: nowIso()
  };
}
