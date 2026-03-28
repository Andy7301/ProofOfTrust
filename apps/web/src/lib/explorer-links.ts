export type SolanaClusterId = "devnet" | "mainnet-beta" | "testnet";

function clientSolanaCluster(): SolanaClusterId {
  const c = process.env.NEXT_PUBLIC_SOLANA_CLUSTER?.trim().toLowerCase();
  if (c === "mainnet" || c === "mainnet-beta") return "mainnet-beta";
  if (c === "testnet") return "testnet";
  return "devnet";
}

/** Solscan transaction URL for a Solana signature (base58). */
export function solanaTxExplorerUrl(signature: string): string | null {
  const s = signature.trim();
  if (!s || s.length < 32) return null;
  const cluster = clientSolanaCluster();
  const q = cluster !== "mainnet-beta" ? `?cluster=${cluster}` : "";
  return `https://solscan.io/tx/${encodeURIComponent(s)}${q}`;
}

function clientTronNetwork(): "nile" | "mainnet" | "shasta" {
  const n = process.env.NEXT_PUBLIC_TRON_NETWORK?.trim().toLowerCase() ?? "";
  if (n === "mainnet" || n === "main") return "mainnet";
  if (n === "shasta") return "shasta";
  return "nile";
}

export function tronExplorerHomeUrl(): string {
  const net = clientTronNetwork();
  if (net === "mainnet") return "https://tronscan.org";
  if (net === "shasta") return "https://shasta.tronscan.org";
  return "https://nile.tronscan.org";
}

/** TronScan transaction URL (Nile, Shasta, or mainnet). */
/** Filecoin Calibration / Onchain Cloud context for a Synapse piece CID (informational). */
export function filecoinPieceDocsUrl(): string {
  return "https://docs.filecoin.cloud/getting-started/";
}

export function tronTxExplorerUrl(txHash: string): string | null {
  const h = txHash.trim();
  if (!h || h.length < 8) return null;
  const net = clientTronNetwork();
  if (net === "mainnet") {
    return `https://tronscan.org/#/transaction/${encodeURIComponent(h)}`;
  }
  if (net === "shasta") {
    return `https://shasta.tronscan.org/#/transaction/${encodeURIComponent(h)}`;
  }
  return `https://nile.tronscan.org/#/transaction/${encodeURIComponent(h)}`;
}
