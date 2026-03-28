import fs from "fs";
import path from "path";

/**
 * Monorepo root is the directory that contains `.env.example`.
 * Uses `process.cwd()` only — `__dirname` breaks when this file is bundled under `.next`.
 */
export function resolveRepoRoot(): string {
  const cwd = path.resolve(process.cwd());
  const parent = path.dirname(cwd);
  if (fs.existsSync(path.join(parent, ".env.example"))) return parent;
  if (fs.existsSync(path.join(cwd, ".env.example"))) return cwd;
  return parent;
}

/** Load repo-root `.env*` into `process.env` (Next only auto-loads from `apps/web`). */
export function loadRootEnvFiles() {
  const repoRoot = resolveRepoRoot();
  const mode = process.env.NODE_ENV ?? "development";
  const files = [
    path.join(repoRoot, ".env"),
    path.join(repoRoot, `.env.${mode}`),
    path.join(repoRoot, ".env.local"),
    path.join(repoRoot, `.env.${mode}.local`)
  ];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const body = t.startsWith("export ") ? t.slice(7).trim() : t;
      const eq = body.indexOf("=");
      if (eq <= 0) continue;
      const key = body.slice(0, eq).trim();
      if (!key) continue;
      let val = body.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}
