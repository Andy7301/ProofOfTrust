import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

const repoRoot = path.join(__dirname, "..");

/** Next 15.x does not support `envDir`; preload monorepo root `.env*` into `process.env` before the dev server loads `apps/web` only. */
function loadRootEnvFiles() {
  const mode = process.env.NODE_ENV ?? "development";
  const files = [
    path.join(repoRoot, ".env"),
    path.join(repoRoot, `.env.${mode}`),
    path.join(repoRoot, ".env.local"),
    path.join(repoRoot, `.env.${mode}.local`)
  ];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const body = t.startsWith("export ") ? t.slice(7).trim() : t;
      const eq = body.indexOf("=");
      if (eq <= 0) continue;
      const key = body.slice(0, eq).trim();
      if (!key) continue;
      let val = body.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

loadRootEnvFiles();

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
  serverExternalPackages
};

export default nextConfig;
