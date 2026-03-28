/**
 * Shared x402 Solana settings for the demo route and the server payment agent (`x402-pay.ts`).
 * Keep `network` CAIP-2 string aligned with `@faremeter/info` (e.g. solana-devnet).
 */
export function getSolanaX402Network(): string {
  return process.env.SOLANA_X402_NETWORK?.trim() || "solana-devnet";
}

/** SPL mint base58 — default devnet USDC. */
export function getSolanaUsdcMintBase58(): string {
  return (
    process.env.SOLANA_USDC_MINT?.trim() ||
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
  );
}
