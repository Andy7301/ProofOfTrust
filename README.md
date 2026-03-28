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

Copy `.env.example` to `.env` or `.env.local` at the **repository root**. `apps/web/next.config.ts` preloads those files into `process.env` (Next does not load env from outside `apps/web` by default). Restart `pnpm dev` after changes.
