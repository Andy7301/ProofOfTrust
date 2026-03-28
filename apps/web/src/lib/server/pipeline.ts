import type {
  AiExtractedData,
  ApprovalDecision,
  DebtRecord,
  FrontedPayment,
  PurchaseRequest,
  ReputationEvent,
  User
} from "@proof/domain";
import { extractPurchaseSignals } from "./ai";
import { recordAlkahestPurchaseAttestation } from "./alkahest";
import { buildApproval, decideRequest } from "./decision";
import { loadDb, mutateDb } from "./db";
import { genId, nowIso } from "./ids";
import { eventApproved, eventRejected } from "./reputation";
import { uploadPurchaseAuditToFilecoin } from "./synapse";

/** Non-sensitive summary for audit trails — avoids putting x402 payload/secrets on-chain or in Filecoin JSON. */
function safeX402ResultSummary(bodyText: string, maxMessage = 220): string {
  const t = bodyText.trim();
  try {
    const j = JSON.parse(t) as Record<string, unknown>;
    const paid = j.paid;
    const message = typeof j.message === "string" ? j.message.slice(0, maxMessage) : undefined;
    return JSON.stringify({ paid, message });
  } catch {
    return t.slice(0, maxMessage);
  }
}

function patchRequest(db: { requests: PurchaseRequest[] }, id: string, patch: Partial<PurchaseRequest>) {
  const i = db.requests.findIndex((r) => r.id === id);
  if (i < 0) return;
  const prev = db.requests[i]!;
  db.requests[i] = { ...prev, ...patch, updatedAt: nowIso() };
}

function pipelineErrorAi(message: string): AiExtractedData {
  return {
    merchantOrService: "—",
    claimedAmount: 0,
    category: "pipeline-error",
    confidence: 0,
    suspiciousFlags: ["pipeline_error"],
    extractedJustification: message
  };
}

export async function runPurchasePipeline(requestId: string): Promise<void> {
  try {
    await runPurchasePipelineSteps(requestId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[runPurchasePipeline]", requestId, err);
    await mutateDb((db) => {
      patchRequest(db, requestId, {
        status: "FAILED",
        aiExtractedData: pipelineErrorAi(message),
        aiConfidence: 0,
        suspicionFlags: ["pipeline_error"]
      });
    });
  }
}

async function runPurchasePipelineSteps(requestId: string): Promise<void> {
  const db0 = await loadDb();
  const request0 = db0.requests.find((r) => r.id === requestId);
  const user0 = request0 ? db0.users.find((u) => u.id === request0.userId) : undefined;
  if (!request0 || !user0) return;

  const ai = await extractPurchaseSignals({
    description: request0.description,
    requestedAmount: request0.requestedAmount
  });

  await mutateDb((db) => {
    patchRequest(db, requestId, {
      aiExtractedData: ai,
      aiConfidence: ai.confidence,
      suspicionFlags: ai.suspiciousFlags,
      status: "AI_VERIFIED"
    });
  });

  const { request: req2, user: u2 } = await loadReqUser(requestId);
  if (!req2 || !u2) return;

  const decided = decideRequest({ user: u2, request: req2, ai });
  const approval: ApprovalDecision = buildApproval(requestId, decided);

  if (decided.decision === "REJECTED") {
    await mutateDb((db) => {
      db.approvals.unshift(approval);
      patchRequest(db, requestId, { status: "REJECTED" });
      db.reputationEvents.unshift(eventRejected(u2.id));
    });
    return;
  }

  if (decided.decision === "MANUAL_REVIEW") {
    await mutateDb((db) => {
      db.approvals.unshift(approval);
      patchRequest(db, requestId, { status: "MANUAL_REVIEW" });
    });
    return;
  }

  await mutateDb((db) => {
    db.approvals.unshift(approval);
    patchRequest(db, requestId, { status: "APPROVED" });
  });

  await mutateDb((db) => {
    patchRequest(db, requestId, { status: "X402_PENDING" });
  });

  const { request: req3 } = await loadReqUser(requestId);
  if (!req3) return;

  const { executePaidFetch } = await import("./x402-pay");
  const paid = await executePaidFetch(req3.targetService);

  const resultSummary = safeX402ResultSummary(paid.bodyText);

  const alkahestPayload = {
    requestId: req3.id,
    userId: req3.userId,
    paid: paid.ok,
    solanaTx: paid.transactionSignature,
    amount: req3.requestedAmount,
    targetService: req3.targetService,
    x402Status: paid.x402Status
  };

  const [alkahestRef, auditPieceCid] = await Promise.all([
    recordAlkahestPurchaseAttestation(alkahestPayload),
    uploadPurchaseAuditToFilecoin({
      ...alkahestPayload,
      description: req3.description,
      resultPreview: resultSummary
    })
  ]);

  const resultPayload =
    paid.ok || !paid.error
      ? paid.bodyText.slice(0, 16_000)
      : JSON.stringify({
          solanaError: paid.error,
          status: paid.status,
          snippet: paid.bodyText.slice(0, 2000)
        }).slice(0, 16_000);

  const payment: FrontedPayment = {
    id: genId("pay"),
    requestId,
    chain: "SOLANA",
    amount: req3.requestedAmount,
    x402Status: paid.x402Status === "PAID" ? "PAID" : "FAILED",
    txHash: paid.transactionSignature,
    resultPayload,
    createdAt: nowIso()
  };

  if (!paid.ok) {
    await mutateDb((db) => {
      db.payments.unshift(payment);
      patchRequest(db, requestId, {
        status: "FAILED",
        alkahestRef,
        auditPieceCid
      });
    });
    return;
  }

  const debt: DebtRecord = {
    id: genId("debt"),
    userId: req3.userId,
    requestId,
    amount: req3.requestedAmount,
    status: "OPEN",
    dueAt: new Date(Date.now() + 7 * 864e5).toISOString(),
    createdAt: nowIso()
  };

  const repEv: ReputationEvent = eventApproved(req3.userId);

  await mutateDb((db) => {
    db.payments.unshift(payment);
    patchRequest(db, requestId, {
      status: "PAID",
      alkahestRef,
      auditPieceCid
    });
    db.debts.unshift(debt);
    const ui = db.users.findIndex((u) => u.id === req3.userId);
    if (ui >= 0) {
      const u = db.users[ui]!;
      db.users[ui] = {
        ...u,
        outstandingDebt: u.outstandingDebt + debt.amount,
        updatedAt: nowIso()
      };
    }
    db.reputationEvents.unshift(repEv);
  });
}

async function loadReqUser(
  requestId: string
): Promise<{ request: PurchaseRequest; user: User } | { request: null; user: null }> {
  const db = await loadDb();
  const request = db.requests.find((r) => r.id === requestId);
  const user = request ? db.users.find((u) => u.id === request.userId) : undefined;
  if (!request || !user) return { request: null, user: null };
  return { request, user };
}
