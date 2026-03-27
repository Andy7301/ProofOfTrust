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

Copy `.env.example` to `.env.local` in `apps/web` or root (depending on final env loading strategy) and fill required values.
