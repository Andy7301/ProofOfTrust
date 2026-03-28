export const serverEnv = {
  /** Empty = auto (use Gemini when GEMINI_API_KEY is set). Set to `mock` to force mock AI. */
  aiProvider: (process.env.AI_PROVIDER ?? "").toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY?.trim(),
  solanaRpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  solanaAgentPrivateKey: process.env.SOLANA_AGENT_PRIVATE_KEY?.trim(),
  /** Set to 1 to skip on-chain x402 while keeping the key in env (escape hatch). */
  solanaX402Disable: process.env.SOLANA_X402_DISABLE === "1",
  /** Set to `mock` to skip TRON tx verification. Default is on-chain verification. */
  tronRepaymentMode: (process.env.TRON_REPAYMENT_MODE ?? "real").toLowerCase(),
  tronRpcUrl: process.env.TRON_RPC_URL ?? "https://nile.trongrid.io",
  alkahestMode: (process.env.ARKHAI_MODE ?? process.env.ALKAHEST_MODE ?? "").toLowerCase(),
  alkahestRpcUrl: process.env.ALKAHEST_RPC_URL?.trim(),
  alkahestPrivateKey: process.env.ALKAHEST_PRIVATE_KEY?.trim() as `0x${string}` | undefined,
  filecoinAuditMode: (process.env.FILECOIN_AUDIT_MODE ?? "").toLowerCase(),
  filecoinCalibrationRpcUrl: process.env.FILECOIN_CALIBRATION_RPC_URL?.trim(),
  synapsePrivateKey: process.env.SYNAPSE_PRIVATE_KEY?.trim() as `0x${string}` | undefined,
  filecoinApiKey: process.env.FILECOIN_API_KEY?.trim(),
  nextPublicBaseUrl: process.env.NEXT_PUBLIC_BASE_URL?.trim() ?? "http://localhost:3000"
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

export function isMockAlkahest() {
  if (serverEnv.alkahestMode === "mock") return true;
  return !serverEnv.alkahestPrivateKey || !serverEnv.alkahestRpcUrl;
}

export function isMockFilecoinAudit() {
  if (serverEnv.filecoinAuditMode === "mock") return true;
  return !serverEnv.synapsePrivateKey || !serverEnv.filecoinCalibrationRpcUrl;
}
