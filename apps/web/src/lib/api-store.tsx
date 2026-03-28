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
  useState,
  type ReactNode
} from "react";

type AppState = {
  user: User | null;
  requests: PurchaseRequest[];
  debts: DebtRecord[];
  approvals: ApprovalDecision[];
  payments: FrontedPayment[];
  reputationEvents: ReputationEvent[];
};

const SIM_ADDRESS = "TNd7SimulatedProofOfTrust111111111111";

const empty: AppState = {
  user: null,
  requests: [],
  debts: [],
  approvals: [],
  payments: [],
  reputationEvents: []
};

type ApiContextValue = {
  state: AppState;
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
};

const ApiContext = createContext<ApiContextValue | null>(null);

async function fetchState(tron: string): Promise<AppState | null> {
  const res = await fetch("/api/state", {
    headers: { "X-Tron-Address": tron },
    cache: "no-store"
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as AppState;
  return data;
}

export function ApiStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(empty);
  const [ready, setReady] = useState(false);

  const sync = useCallback(async (tron: string) => {
    const next = await fetchState(tron);
    if (next) setState(next);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("proof_wallet");
    if (!saved) {
      setReady(true);
      return;
    }
    void (async () => {
      let res = await fetch("/api/state", {
        headers: { "X-Tron-Address": saved },
        cache: "no-store"
      });
      if (res.status === 404) {
        await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tronAddress: saved })
        });
        res = await fetch("/api/state", {
          headers: { "X-Tron-Address": saved },
          cache: "no-store"
        });
      }
      if (res.ok) {
        const data = (await res.json()) as AppState;
        setState(data);
      }
      setReady(true);
    })();
  }, []);

  const hasPipelinePending = state.requests.some((r) =>
    ["PENDING", "AI_VERIFIED", "APPROVED", "X402_PENDING"].includes(r.status)
  );

  useEffect(() => {
    if (!state.user || !hasPipelinePending) return;
    const tron = state.user.tronAddress;
    const id = setInterval(() => {
      void sync(tron);
    }, 2000);
    return () => clearInterval(id);
  }, [state.user, hasPipelinePending, sync]);

  const connect = useCallback(
    async (simulated: boolean) => {
      let address: string;
      if (simulated) {
        address = SIM_ADDRESS;
        localStorage.setItem("proof_sim", "1");
      } else {
        const { requestTronLinkAddress } = await import("@/lib/tronlink");
        address = await requestTronLinkAddress();
        localStorage.removeItem("proof_sim");
      }
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tronAddress: address })
      });
      localStorage.setItem("proof_wallet", address);
      await sync(address);
    },
    [sync]
  );

  const disconnect = useCallback(() => {
    setState(empty);
    localStorage.removeItem("proof_wallet");
    localStorage.removeItem("proof_sim");
  }, []);

  const createRequest = useCallback(
    async (input: {
      description: string;
      targetService: string;
      requestedAmount: number;
      urgency: PurchaseRequest["urgency"];
    }) => {
      const tron = localStorage.getItem("proof_wallet");
      if (!tron) throw new Error("Not connected");
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tron-Address": tron
        },
        body: JSON.stringify(input)
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Request failed");
      }
      const { id } = (await res.json()) as { id: string };
      await sync(tron);
      return id;
    },
    [sync]
  );

  const repayDebt = useCallback(
    async (debtId: string, txHash: string) => {
      const tron = localStorage.getItem("proof_wallet");
      if (!tron) throw new Error("Not connected");
      const res = await fetch(`/api/debts/${encodeURIComponent(debtId)}/repay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tron-Address": tron
        },
        body: JSON.stringify({ txHash })
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Repay failed");
      }
      await sync(tron);
    },
    [sync]
  );

  const value = useMemo<ApiContextValue>(
    () => ({
      state,
      ready,
      connect,
      disconnect,
      createRequest,
      repayDebt
    }),
    [state, ready, connect, disconnect, createRequest, repayDebt]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useMockStore() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useMockStore must be used within ApiStoreProvider");
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
