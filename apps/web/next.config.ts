import type { NextConfig } from "next";
import path from "path";

/**
 * Keep Faremeter + arktype + Solana kit out of the server bundle graph.
 * Otherwise Webpack can emit broken numeric chunks (`Cannot find module './773.js'`).
 */
const serverExternalPackages = [
  "arktype",
  "@faremeter/fetch",
  "@faremeter/info",
  "@faremeter/logs",
  "@faremeter/payment-solana",
  "@faremeter/types",
  "@solana/addresses",
  "@solana/kit",
  "@solana/rpc",
  "@solana/rpc-api",
  "@solana/rpc-types",
  "@solana/spl-token",
  "@solana/transactions",
  "@solana/web3.js",
  "@solana-program/compute-budget",
  "@solana-program/memo",
  "@solana-program/token",
  "bs58"
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages,
  /** Monorepo: load `.env*` from repo root (same as `.env.example`), not only `apps/web`. */
  envDir: path.join(__dirname, "..")
};

export default nextConfig;
