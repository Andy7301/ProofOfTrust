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

Copy `.env.example` to `.env` or `.env.local` at the **repository root**. `apps/web/load-root-env.ts` loads them from `next.config.ts` and again from `src/instrumentation.ts` so values survive Next’s own `apps/web` `.env` pass (which can overwrite with empty keys). Restart `pnpm dev` after changes.

If Solana or API secrets still look missing: ensure **`apps/web/.env*`** does not define the same variable with an empty value, and **`NEXT_PUBLIC_USE_MOCK_CLIENT`** is not `1` unless you intend the browser mock store.
