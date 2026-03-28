import { join } from "path";

/** Resolves data dir whether dev runs from repo root or apps/web */
export function getDataDir(): string {
  if (process.env.PROOF_DATA_DIR) return process.env.PROOF_DATA_DIR;
  const cwd = process.cwd();
  if (cwd.endsWith("apps/web") || cwd.endsWith("apps\\web")) {
    return join(cwd, "data");
  }
  return join(cwd, "apps", "web", "data");
}

export function getDbPath(): string {
  return join(getDataDir(), "db.json");
}
