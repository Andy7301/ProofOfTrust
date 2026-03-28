import { loadRootEnvFiles } from "../load-root-env";

/**
 * Next applies `apps/web` `.env*` after `next.config` runs; an empty key there can wipe
 * monorepo-root values. Re-apply repo-root env once the Node server is up.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  loadRootEnvFiles();
}
