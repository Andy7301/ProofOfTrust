import type { ApprovalDecision, DecisionType, PurchaseRequest, User } from "@proof/domain";
import { defaultPolicyConfig } from "@proof/core";
import type { AiExtractedData } from "@proof/domain";
import { genId, nowIso } from "./ids";

export function decideRequest(input: {
  user: User;
  request: PurchaseRequest;
  ai: AiExtractedData;
}): { decision: DecisionType; reasons: string[]; trustScoreSnapshot: number } {
  const { user, request, ai } = input;
  const trust = user.reputationScore;
  const policy = defaultPolicyConfig;
  const reasons: string[] = [];

  if (request.requestedAmount > policy.maxRequestAmount) {
    return {
      decision: "REJECTED",
      reasons: [`Requested amount exceeds maxRequestAmount (${policy.maxRequestAmount}).`],
      trustScoreSnapshot: trust
    };
  }

  if (user.outstandingDebt + request.requestedAmount > user.creditLimit) {
    return {
      decision: "REJECTED",
      reasons: ["Outstanding debt plus request exceeds credit limit."],
      trustScoreSnapshot: trust
    };
  }

  if (ai.confidence < 0.5) {
    return {
      decision: "REJECTED",
      reasons: ["AI confidence below minimum.", "Possible fraud or unclear merchant."],
      trustScoreSnapshot: trust
    };
  }

  if (ai.suspiciousFlags.length > 0) {
    return {
      decision: "MANUAL_REVIEW",
      reasons: ["Suspicious signals from extraction — queued for review.", ...ai.suspiciousFlags],
      trustScoreSnapshot: trust
    };
  }

  const d = request.description.toLowerCase();
  if (d.includes("reject") || d.includes("fraud") || d.includes("stolen")) {
    return {
      decision: "REJECTED",
      reasons: ["Request text flagged as high risk."],
      trustScoreSnapshot: trust
    };
  }

  if (d.includes("review")) {
    return {
      decision: "MANUAL_REVIEW",
      reasons: ["Keyword triggered manual review queue."],
      trustScoreSnapshot: trust
    };
  }

  if (trust < policy.minTrustAutoApprove) {
    return {
      decision: "MANUAL_REVIEW",
      reasons: [`Trust score ${trust.toFixed(2)} below auto-approve threshold ${policy.minTrustAutoApprove}.`],
      trustScoreSnapshot: trust
    };
  }

  reasons.push("Trust score within policy.", "Amount under credit limit.", "AI confidence acceptable.");
  return { decision: "APPROVED", reasons, trustScoreSnapshot: trust };
}

export function buildApproval(
  requestId: string,
  result: { decision: DecisionType; reasons: string[]; trustScoreSnapshot: number }
): ApprovalDecision {
  return {
    id: genId("apr"),
    requestId,
    decision: result.decision,
    reasons: result.reasons,
    trustScoreSnapshot: result.trustScoreSnapshot,
    policySnapshot: {
      minTrust: defaultPolicyConfig.minTrustAutoApprove,
      maxAmount: defaultPolicyConfig.maxRequestAmount
    },
    createdAt: nowIso()
  };
}
