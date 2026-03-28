"use client";

import type {
  ApprovalDecision,
  DebtRecord,
  FrontedPayment,
  PurchaseRequest,
  ReputationEvent,
  User
} from "@proof/domain";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode
} from "react";

type MockState = {
  user: User | null;
  requests: PurchaseRequest[];
  debts: DebtRecord[];
  approvals: ApprovalDecision[];
  payments: FrontedPayment[];
  reputationEvents: ReputationEvent[];
};

const SIM_ADDRESS = "TNd7SimulatedProofOfTrust111111111111";

function nowIso() {
  return new Date().toISOString();
}

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

function seedUser(address: string): User {
  return {
    id: "user_demo",
    displayName: "Demo User",
    tronAddress: address,
    reputationScore: 0.78,
    creditLimit: 240,
    outstandingDebt: 54,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

function seedRequests(userId: string): PurchaseRequest[] {
  const t = nowIso();
  return [
    {
      id: "req_seed_1",
      userId,
      description: "Premium market intel API for quarterly review.",
      targetService: "https://api.demo/x402/research",
      requestedAmount: 18,
      urgency: "NORMAL",
      suspicionFlags: [],
      status: "PAID",
      aiExtractedData: {
        merchantOrService: "Premium Research API",
        claimedAmount: 18,
        category: "market-intelligence",
        confidence: 0.86,
        suspiciousFlags: [],
        extractedJustification: "Legitimate business research request."
      },
      aiConfidence: 0.86,
      createdAt: t,
      updatedAt: t
    }
  ];
}

function seedDebts(userId: string): DebtRecord[] {
  const t = nowIso();
  return [
    {
      id: "debt_seed_1",
      userId,
      requestId: "req_seed_1",
      amount: 54,
      status: "OPEN",
      dueAt: new Date(Date.now() + 7 * 864e5).toISOString(),
      createdAt: t
    }
  ];
}

type Action =
  | { type: "CONNECT"; address: string }
  | { type: "DISCONNECT" }
  | { type: "UPSERT_REQUEST"; request: PurchaseRequest }
  | { type: "ADD_APPROVAL"; approval: ApprovalDecision }
  | { type: "ADD_PAYMENT"; payment: FrontedPayment }
  | { type: "ADD_DEBT"; debt: DebtRecord }
  | { type: "UPDATE_USER"; user: User }
  | { type: "REPAY_DEBT"; debtId: string; txHash: string }
  | { type: "ADD_REPUTATION"; event: ReputationEvent };

function reducer(state: MockState, action: Action): MockState {
  switch (action.type) {
    case "CONNECT": {
      const user = seedUser(action.address);
      return {
        ...state,
        user,
        requests: seedRequests(user.id),
        debts: seedDebts(user.id),
        approvals: [],
        payments: []
      };
    }
    case "DISCONNECT":
      return {
        user: null,
        requests: [],
        debts: [],
        approvals: [],
        payments: [],
        reputationEvents: []
      };
    case "UPSERT_REQUEST": {
      const idx = state.requests.findIndex((r) => r.id === action.request.id);
      const requests =
        idx >= 0
          ? state.requests.map((r) => (r.id === action.request.id ? action.request : r))
          : [action.request, ...state.requests];
      return { ...state, requests };
    }
    case "ADD_APPROVAL":
      return { ...state, approvals: [action.approval, ...state.approvals] };
    case "ADD_PAYMENT":
      return { ...state, payments: [action.payment, ...state.payments] };
    case "ADD_DEBT": {
      const debts = [action.debt, ...state.debts];
      let user = state.user;
      if (user && action.debt.userId === user.id) {
        user = {
          ...user,
          outstandingDebt: user.outstandingDebt + action.debt.amount,
          updatedAt: nowIso()
        };
      }
      return { ...state, debts, user };
    }
    case "UPDATE_USER":
      return { ...state, user: action.user };
    case "REPAY_DEBT": {
      const debts = state.debts.map((d) =>
        d.id === action.debtId
          ? {
              ...d,
              status: "REPAID" as const,
              repaidAt: nowIso(),
              tronRepaymentTxHash: action.txHash
            }
          : d
      );
      const repaid = debts.find((d) => d.id === action.debtId);
      let user = state.user;
      if (user && repaid) {
        user = {
          ...user,
          outstandingDebt: Math.max(0, user.outstandingDebt - repaid.amount),
          reputationScore: Math.min(1, user.reputationScore + 0.02),
          updatedAt: nowIso()
        };
      }
      return { ...state, debts, user };
    }
    case "ADD_REPUTATION":
      return { ...state, reputationEvents: [action.event, ...state.reputationEvents] };
    default:
      return state;
  }
}

const initialState: MockState = {
  user: null,
  requests: [],
  debts: [],
  approvals: [],
  payments: [],
  reputationEvents: []
};

type MockContextValue = {
  state: MockState;
  /** False until client has hydrated wallet from localStorage (avoid redirect flash). */
  ready: boolean;
  connect: (simulated: boolean) => Promise<void>;
  disconnect: () => void;
  createRequest: (input: {
    description: string;
    targetService: string;
    requestedAmount: number;
    urgency: PurchaseRequest["urgency"];
  }) => Promise<string>;
  repayDebt: (debtId: string, txHash: string) => Promise<void>;
  repayDebtFromWallet: (debtId: string) => Promise<void>;
};

const MockContext = createContext<MockContextValue | null>(null);

function shouldReject(description: string): boolean {
  const d = description.toLowerCase();
  return d.includes("reject") || d.includes("fraud") || d.includes("stolen");
}

function shouldManualReview(description: string): boolean {
  return description.toLowerCase().includes("review");
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("proof_wallet");
    if (saved) {
      dispatch({ type: "CONNECT", address: saved });
    }
    setReady(true);
  }, []);

  const connect = useCallback(async (simulated: boolean) => {
    let address: string;
    if (simulated) {
      address = SIM_ADDRESS;
      localStorage.setItem("proof_sim", "1");
    } else {
      const { requestTronLinkAddress } = await import("@/lib/tronlink");
      address = await requestTronLinkAddress();
      localStorage.removeItem("proof_sim");
    }
    dispatch({ type: "CONNECT", address });
    localStorage.setItem("proof_wallet", address);
  }, []);

  const disconnect = useCallback(() => {
    dispatch({ type: "DISCONNECT" });
    localStorage.removeItem("proof_wallet");
    localStorage.removeItem("proof_sim");
  }, []);

  const runPipeline = useCallback((initial: PurchaseRequest) => {
    void (async () => {
      let req = { ...initial };

      await delay(600);
      const aiExtracted = {
        merchantOrService: "Parsed Service",
        claimedAmount: req.requestedAmount,
        category: "api-access",
        confidence: shouldReject(req.description) ? 0.42 : 0.84,
        suspiciousFlags: shouldManualReview(req.description) ? ["manual_review_keyword"] : [],
        extractedJustification: "Simulated Gemini extraction for hackathon demo."
      };

      req = {
        ...req,
        status: "AI_VERIFIED",
        aiExtractedData: aiExtracted,
        aiConfidence: aiExtracted.confidence,
        suspicionFlags: aiExtracted.suspiciousFlags,
        updatedAt: nowIso()
      };
      dispatch({ type: "UPSERT_REQUEST", request: req });

      await delay(500);

      if (shouldReject(req.description)) {
        const approval: ApprovalDecision = {
          id: genId("apr"),
          requestId: req.id,
          decision: "REJECTED",
          reasons: [
            "Simulated: request text flagged as high risk.",
            "Confidence below threshold."
          ],
          trustScoreSnapshot: 0.45,
          policySnapshot: { minTrust: 0.65 },
          createdAt: nowIso()
        };
        dispatch({ type: "ADD_APPROVAL", approval });
        req = { ...req, status: "REJECTED", updatedAt: nowIso() };
        dispatch({ type: "UPSERT_REQUEST", request: req });
        return;
      }

      if (shouldManualReview(req.description)) {
        const approval: ApprovalDecision = {
          id: genId("apr"),
          requestId: req.id,
          decision: "MANUAL_REVIEW",
          reasons: ["Keyword triggered manual review queue.", "No automatic fronting."],
          trustScoreSnapshot: 0.7,
          policySnapshot: { minTrust: 0.65 },
          createdAt: nowIso()
        };
        dispatch({ type: "ADD_APPROVAL", approval });
        req = { ...req, status: "MANUAL_REVIEW", updatedAt: nowIso() };
        dispatch({ type: "UPSERT_REQUEST", request: req });
        return;
      }

      const approval: ApprovalDecision = {
        id: genId("apr"),
        requestId: req.id,
        decision: "APPROVED",
        reasons: [
          "Trust score within policy.",
          "Amount under credit limit.",
          "AI confidence acceptable."
        ],
        trustScoreSnapshot: 0.78,
        policySnapshot: { minTrust: 0.65, maxAmount: 120 },
        createdAt: nowIso()
      };
      dispatch({ type: "ADD_APPROVAL", approval });
      req = { ...req, status: "APPROVED", updatedAt: nowIso() };
      dispatch({ type: "UPSERT_REQUEST", request: req });

      await delay(400);
      req = { ...req, status: "X402_PENDING", updatedAt: nowIso() };
      dispatch({ type: "UPSERT_REQUEST", request: req });

      await delay(800);
      const payment: FrontedPayment = {
        id: genId("pay"),
        requestId: req.id,
        chain: "SOLANA",
        amount: req.requestedAmount,
        x402Status: "PAID",
        txHash: `5x402sim_${req.id.slice(0, 8)}`,
        resultPayload: JSON.stringify({
          summary: "Simulated paid API response: strategic insights generated.",
          tokens: 420
        }),
        createdAt: nowIso()
      };
      dispatch({ type: "ADD_PAYMENT", payment });

      req = { ...req, status: "PAID", updatedAt: nowIso() };
      dispatch({ type: "UPSERT_REQUEST", request: req });

      const debt: DebtRecord = {
        id: genId("debt"),
        userId: req.userId,
        requestId: req.id,
        amount: req.requestedAmount,
        status: "OPEN",
        dueAt: new Date(Date.now() + 7 * 864e5).toISOString(),
        createdAt: nowIso()
      };
      dispatch({ type: "ADD_DEBT", debt });
    })();
  }, []);

  const createRequest = useCallback(
    async (input: {
      description: string;
      targetService: string;
      requestedAmount: number;
      urgency: PurchaseRequest["urgency"];
    }) => {
      if (!state.user) throw new Error("Not connected");
      const requestId = genId("req");
      const request: PurchaseRequest = {
        id: requestId,
        userId: state.user.id,
        description: input.description,
        targetService: input.targetService,
        requestedAmount: input.requestedAmount,
        urgency: input.urgency,
        suspicionFlags: [],
        status: "PENDING",
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      dispatch({ type: "UPSERT_REQUEST", request });
      runPipeline(request);
      return requestId;
    },
    [state.user, runPipeline]
  );

  const repayDebt = useCallback(async (debtId: string, txHash: string) => {
    const debt = state.debts.find((d) => d.id === debtId);
    dispatch({ type: "REPAY_DEBT", debtId, txHash });
    dispatch({
      type: "ADD_REPUTATION",
      event: {
        id: genId("rep"),
        userId: debt?.userId ?? state.user?.id ?? "user_demo",
        eventType: "REPAYMENT_SUCCESS",
        delta: 0.02,
        explanation: "Simulated successful TRON Nile repayment.",
        createdAt: nowIso()
      }
    });
  }, [state.debts, state.user?.id]);

  const repayDebtFromWallet = useCallback(
    async (debtId: string) => {
      await repayDebt(debtId, `mock_tronlink_${Date.now()}`);
    },
    [repayDebt]
  );

  const value = useMemo<MockContextValue>(
    () => ({
      state,
      ready,
      connect,
      disconnect,
      createRequest,
      repayDebt,
      repayDebtFromWallet
    }),
    [state, ready, connect, disconnect, createRequest, repayDebt, repayDebtFromWallet]
  );

  return <MockContext.Provider value={value}>{children}</MockContext.Provider>;
}

export function useMockStore() {
  const ctx = useContext(MockContext);
  if (!ctx) throw new Error("useMockStore must be used within MockStoreProvider");
  return ctx;
}

export function getApprovalForRequest(
  approvals: ApprovalDecision[],
  requestId: string
): ApprovalDecision | undefined {
  return approvals.find((a) => a.requestId === requestId);
}

export function getPaymentForRequest(
  payments: FrontedPayment[],
  requestId: string
): FrontedPayment | undefined {
  return payments.find((p) => p.requestId === requestId);
}

export function getDebtForRequest(debts: DebtRecord[], requestId: string): DebtRecord | undefined {
  return debts.find((d) => d.requestId === requestId);
}
