# ProofOfTrust

Hackathon MVP: a web app where users open **purchase requests** on credit, the **server agent** pays merchants via **x402 on Solana (USDC)**, users **repay on TRON**, and **Filecoin (Synapse / Calibration)** paths record settlement-style audit metadata.

## What’s in the repo

| Path | Role |
|------|------|
| `apps/web` | Next.js 15 app: UI, Route Handlers (`/api/*`), Tailwind |
| `packages/domain` | Shared TypeScript types for users, requests, debts, Filecoin fields |
| `packages/core` | Shared policy / config primitives |

Orchestration: **pnpm** workspaces + **Turborepo** (`turbo.json`).

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (repo pins `pnpm@9.12.0` in `package.json`)

## Quick start

```bash
pnpm install
cp .env.example .env          # optional: edit values before first run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). From the repo root, `pnpm dev` runs the web app in parallel via Turbo (`next dev` in `apps/web`).

**Production build** (from root):

```bash
pnpm build
pnpm --filter @proof/web start
```

## Scripts (root)

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Development servers |
| `pnpm build` | Production build (depends on package builds) |
| `pnpm lint` | ESLint (web and configured packages) |
| `pnpm typecheck` | TypeScript across the workspace |
| `pnpm format` | Prettier |

Package-specific scripts live in each `package.json` (e.g. `apps/web`).

## Environment variables

**Authoritative template:** [`.env.example`](.env.example) — copy to **repo root** `.env` and/or **`apps/web/.env.local`**.

**Loading order:** Next.js loads `apps/web/.env*` automatically. Root `.env` / `.env.local` are merged in **`apps/web/next.config.ts`** via **`apps/web/load-root-env.ts`** (Node only — do not import that module from `instrumentation` or client bundles). Restart `pnpm dev` after changes.

**Gotchas:**

- If a variable is set **empty** in `apps/web/.env*`, it can **override** a non-empty value from the root — remove the line or set a real value.
- **`NEXT_PUBLIC_USE_MOCK_CLIENT=1`** forces an in-browser mock store instead of the JSON API; unset it unless you want that behavior.

**High-level groups:**

- **App / URLs:** `NEXT_PUBLIC_*`, `NEXT_PUBLIC_BASE_URL`
- **Solana x402 (agent payer):** `SOLANA_RPC_URL`, `SOLANA_AGENT_PRIVATE_KEY`, `SOLANA_USDC_MINT`, `NEXT_PUBLIC_X402_DEMO_PAY_TO`, `SOLANA_X402_PAYMENT_MICRO_USDC`, `SOLANA_X402_DISABLE`, etc.
- **TRON repayment:** `TRON_RPC_URL`, `TRON_PRIVATE_KEY`, `TRON_REPAY_RECEIVER`, `TRON_REPAYMENT_MODE`
- **Gemini (AI):** `GEMINI_API_KEY`, `AI_PROVIDER=mock` to force mock without a key
- **Filecoin / Synapse:** `FILECOIN_CALIBRATION_RPC_URL`, `SYNAPSE_PRIVATE_KEY`, `FILECOIN_AUDIT_MODE`

## API surface (web)

Representative routes under `apps/web/src/app/api/`:

- **`POST /api/session`** — bind session to a TRON address (creates user in dev DB)
- **`GET /api/me`**, **`GET /api/state`** — current user and aggregated state
- **`/api/requests`**, **`/api/requests/[id]`** — purchase requests
- **`/api/debts/[id]/repay-quote`**, **`POST /api/debts/[id]/repay`** — TRON repayment flow
- **`GET /api/x402/demo`** — x402 v2 demo merchant (see below)
- **`GET /api/health`** — health check

## x402 on Solana

The server agent pays protected URLs with **`@faremeter/fetch`** and **`@faremeter/payment-solana/exact`** (Faremeter-style stack). The in-app demo merchant is **`GET /api/x402/demo`**, using x402 **v2** headers (`PAYMENT-REQUIRED` / `PAYMENT-SIGNATURE`). Other stacks may use **v1** `X-PAYMENT` or facilitators; the protocol idea is the same.

Fund the **agent** wallet (devnet SOL + devnet USDC) before live payments; set **`NEXT_PUBLIC_X402_DEMO_PAY_TO`** to the base58 address that should receive USDC from the demo. Use **`SOLANA_X402_DISABLE=1`** to avoid on-chain spend while keeping keys in `.env`.

Background, SDK comparison, and minimal native examples: **[How to get started with x402 on Solana](https://solana.com/developers/guides/getstarted/intro-to-x402)** (Solana Foundation).
