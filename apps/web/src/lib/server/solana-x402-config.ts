import {
  caip2ToCluster,
  lookupKnownSPLToken,
  lookupX402Network
} from "@faremeter/info/solana";

/**
 * Shared x402 Solana settings for the demo route and the server payment agent (`x402-pay.ts`).
 * Env may use legacy ids (`solana-devnet`) or CAIP-2; payment matching uses CAIP-2 internally.
 */
export function getSolanaX402Network(): string {
  return process.env.SOLANA_X402_NETWORK?.trim() || "solana-devnet";
}

/**
 * Network string for x402 v2 `accepts[].network`. Faremeter matches this against
 * `lookupX402Network(wallet.network).caip2` — legacy-only strings like `solana-devnet` in
 * `accepts` produce **no applicable payers**.
 */
export function getSolanaX402AcceptNetwork(): string {
  return lookupX402Network(getSolanaX402Network()).caip2;
}

/**
 * SPL mint base58 for x402 `accepts[].asset`.
 * Default uses `@faremeter/info/solana` `lookupKnownSPLToken` (same approach as Solana’s x402 guide / Corbits examples).
 */
export function getSolanaUsdcMintBase58(): string {
  const fromEnv = process.env.SOLANA_USDC_MINT?.trim();
  if (fromEnv) return fromEnv;
  const net = lookupX402Network(getSolanaX402Network());
  const cluster = caip2ToCluster(net.caip2);
  if (!cluster) {
    return "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
  }
  const known = lookupKnownSPLToken(cluster, "USDC");
  if (known) return known.address;
  return "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
}
