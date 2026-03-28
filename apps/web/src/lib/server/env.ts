export const serverEnv = {
  /** Empty = auto (use Gemini when GEMINI_API_KEY is set). Set to `mock` to force mock AI. */
  aiProvider: (process.env.AI_PROVIDER ?? "").toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY?.trim(),
  solanaRpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  solanaAgentPrivateKey: process.env.SOLANA_AGENT_PRIVATE_KEY?.trim(),
  /** Set to `mock` to skip on-chain x402. Otherwise real when SOLANA_AGENT_PRIVATE_KEY is set. */
  solanaX402Mode: (process.env.SOLANA_X402_MODE ?? "").toLowerCase(),
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

export function isMockSolanaX402() {
  if (serverEnv.solanaX402Mode === "mock") return true;
  return !serverEnv.solanaAgentPrivateKey;
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
