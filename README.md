# ProofOfTrust

Monorepo foundation for the ProofOfTrust hackathon MVP.

## Workspace layout

- `apps/web`: Next.js app (UI + API routes)
- `packages/domain`: shared domain types
- `packages/core`: shared policy/config primitives

## Prerequisites

- Node.js 20+
- pnpm 9+

## Quick start

```bash
pnpm install
pnpm dev
```

## Environment

Use **`apps/web/.env.local`** (standard Next) or a **repository root** `.env` / `.env.local`. Root files are merged in **`next.config.ts`** via `load-root-env.ts` (Node only — do not import that module from `instrumentation` or client code). Restart `pnpm dev` after changes.

If secrets look missing: ensure **`apps/web/.env*`** does not define the same variable with an empty value (that overrides root), and **`NEXT_PUBLIC_USE_MOCK_CLIENT`** is not `1` unless you intend the browser mock store.

## x402 on Solana

The server agent pays protected URLs with **`@faremeter/fetch`** + **`@faremeter/payment-solana/exact`** (Faremeter / Corbits-style stack, as in the ecosystem overview). The in-app demo merchant is **`GET /api/x402/demo`**, using x402 **v2** headers (`PAYMENT-REQUIRED` / `PAYMENT-SIGNATURE`). Other stacks use **v1** `X-PAYMENT` or facilitators; the protocol idea is the same.

Background, SDK comparison, and minimal native examples: **[How to get started with x402 on Solana](https://solana.com/developers/guides/getstarted/intro-to-x402)** (Solana Foundation).
