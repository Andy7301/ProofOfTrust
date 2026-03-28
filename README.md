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

Copy `.env.example` to `.env` or `.env.local` at the **repository root**. Next.js is configured (`apps/web/next.config.ts` `envDir`) to load those files so server secrets like `SOLANA_AGENT_PRIVATE_KEY` apply to `apps/web`. Restart `pnpm dev` after changes.
