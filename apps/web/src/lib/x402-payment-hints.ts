import type { FrontedPayment } from "@proof/domain";

export type X402PaymentHint = {
  isMock: boolean;
  /** Human explanation when isMock */
  why?: string;
};

/**
 * Explains whether this payment record reflects a real Solana spend or a mock path.
 */
export function describeX402Payment(payment: FrontedPayment): X402PaymentHint {
  const sig = payment.txHash?.trim() ?? "";
  /** Real Solana signatures are long base58; mock client uses short `5x402sim_*` placeholders. */
  if (sig.length >= 80 && !sig.startsWith("5x402sim_")) {
    return { isMock: false };
  }

  const raw = payment.resultPayload?.trim() ?? "";
  if (raw) {
    try {
      const j = JSON.parse(raw) as { mode?: string; reason?: string; summary?: string };
      if (j.mode === "mock") {
        return { isMock: true, why: j.reason || j.summary };
      }
    } catch {
      if (raw.includes("Mock x402") || raw.includes('"mode":"mock"')) {
        return {
          isMock: true,
          why: "Server returned a mock x402 payload (check SOLANA_AGENT_PRIVATE_KEY or SOLANA_X402_DISABLE)."
        };
      }
    }
  }

  if (payment.txHash?.startsWith("5x402sim_")) {
    return {
      isMock: true,
      why: "You are on the in-browser mock client (NEXT_PUBLIC_USE_MOCK_CLIENT=1). Data never hits the server pipeline or Solana."
    };
  }

  if (payment.x402Status === "PAID" && !payment.txHash) {
    return {
      isMock: true,
      why: "Marked paid but no Solana signature — often mock mode or a non-settlement x402 resource."
    };
  }

  return { isMock: false };
}
