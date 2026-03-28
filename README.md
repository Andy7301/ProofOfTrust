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

Create **`apps/web/.env.local`** and paste variables from [`.env.example`](.env.example) (or `cp .env.example apps/web/.env.local` and edit). Next.js only auto-loads env files from **`apps/web`**, not the repo root.

```bash
pnpm install
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

**Required for local dev:** **`apps/web/.env.local`**. Use [`.env.example`](.env.example) as the checklist of keys; copy or merge into that file.

**Optional root env:** A repo-root `.env` or `.env.local` is merged in **`apps/web/next.config.ts`** via **`apps/web/load-root-env.ts`** so you can keep secrets at the monorepo root if you prefer (Node only — do not import that module from `instrumentation` or client bundles). Next still reads **`apps/web/.env.local`** first for anything you put there.

**Gotchas:**

- If a variable is set **empty** in `apps/web/.env*`, it can **override** a non-empty value from the root — remove the line or set a real value.
- **`NEXT_PUBLIC_USE_MOCK_CLIENT=1`** forces an in-browser mock store instead of the JSON API; unset it unless you want that behavior.

Restart **`pnpm dev`** after env changes.

**High-level groups:**

- **App / URLs:** `NEXT_PUBLIC_*`, `NEXT_PUBLIC_BASE_URL`
- **Solana x402 (agent payer):** `SOLANA_RPC_URL`, `SOLANA_AGENT_PRIVATE_KEY`, `SOLANA_USDC_MINT`, `NEXT_PUBLIC_X402_DEMO_PAY_TO`, `SOLANA_X402_PAYMENT_MICRO_USDC`, `SOLANA_X402_DISABLE`, etc.
- **TRON repayment:** `TRON_RPC_URL`, `TRON_REPAY_RECEIVER`, `TRON_REPAYMENT_MODE`, `TRON_SUN_PER_DEBT_DOLLAR`
- **Gemini (AI):** `GEMINI_API_KEY`, `AI_PROVIDER=mock` to force mock without a key
- **Filecoin / Synapse:** `FILECOIN_CALIBRATION_RPC_URL`, `SYNAPSE_PRIVATE_KEY`, `FILECOIN_AUDIT_MODE`

## API surface (web)

Representative routes under `apps/web/src/app/api/`:

- **`POST /api/session`** — bind session to a TRON address (creates user in dev DB)
- **`GET /api/me`**, **`GET /api/state`** — current user and aggregated state
- **`/api/requests`**, **`/api/requests/[id]`** — purchase requests
- **`/api/debts/[id]/repay-quote`**, **`POST /api/debts/[id]/repay`** — TRON repayment flow
- **`GET /api/x402/demo`** — x402 v2 paywalled JSON (dev / testing)
- **`GET /api/health`** — health check
