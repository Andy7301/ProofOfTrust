import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "@faremeter/fetch",
    "@faremeter/payment-solana",
    "@faremeter/info",
    "@solana/web3.js",
    "bs58"
  ]
};

export default nextConfig;
