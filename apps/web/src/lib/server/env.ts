/** Read env at access time so values are never frozen before monorepo root `.env` is applied. */
function e(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export const serverEnv = {
  get aiProvider() {
    return (process.env.AI_PROVIDER ?? "").toLowerCase();
  },
  get geminiApiKey() {
    return e("GEMINI_API_KEY");
  },
  /** e.g. gemini-3-flash-preview — override with GEMINI_MODEL */
  get geminiModel() {
    return e("GEMINI_MODEL") ?? "gemini-3-flash-preview";
  },
  /** When 1, do not fall back to heuristic extraction on 429 / quota errors */
  get geminiStrictQuota() {
    return process.env.GEMINI_STRICT_QUOTA === "1";
  },
  get solanaRpcUrl() {
    return process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  },
  get solanaAgentPrivateKey() {
    return e("SOLANA_AGENT_PRIVATE_KEY");
  },
  get solanaX402Disable() {
    return process.env.SOLANA_X402_DISABLE === "1";
  },
  get tronRepaymentMode() {
    return (process.env.TRON_REPAYMENT_MODE ?? "real").toLowerCase();
  },
  get tronRpcUrl() {
    return process.env.TRON_RPC_URL ?? "https://nile.trongrid.io";
  },
  get filecoinAuditMode() {
    return (process.env.FILECOIN_AUDIT_MODE ?? "").toLowerCase();
  },
  get filecoinCalibrationRpcUrl() {
    return e("FILECOIN_CALIBRATION_RPC_URL");
  },
  get synapsePrivateKey() {
    return e("SYNAPSE_PRIVATE_KEY") as `0x${string}` | undefined;
  },
  get filecoinApiKey() {
    return e("FILECOIN_API_KEY");
  },
  get nextPublicBaseUrl() {
    return e("NEXT_PUBLIC_BASE_URL") ?? "http://localhost:3000";
  }
};

export function isMockAi() {
  if (serverEnv.aiProvider === "mock") return true;
  return !serverEnv.geminiApiKey;
}

/** True when we cannot or must not run Faremeter + on-chain x402 (no key, or explicit disable). */
export function isMockSolanaX402() {
  if (serverEnv.solanaX402Disable) return true;
  return !serverEnv.solanaAgentPrivateKey;
}

/** Why the server is skipping real Solana x402 (for mock payloads + UI hints). */
export function solanaX402MockReason(): string {
  if (serverEnv.solanaX402Disable) {
    return "SOLANA_X402_DISABLE=1 — remove it to allow on-chain x402 when SOLANA_AGENT_PRIVATE_KEY is set.";
  }
  if (!serverEnv.solanaAgentPrivateKey) {
    return "SOLANA_AGENT_PRIVATE_KEY is missing or empty — the server has no wallet to sign USDC transfers. Restart dev after editing .env.";
  }
  return "Solana x402 is not running on-chain.";
}

export function isMockTronRepay() {
  return serverEnv.tronRepaymentMode === "mock";
}

export function isMockFilecoinAudit() {
  if (serverEnv.filecoinAuditMode === "mock") return true;
  return !serverEnv.synapsePrivateKey || !serverEnv.filecoinCalibrationRpcUrl;
}
