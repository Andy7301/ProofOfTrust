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
