import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { dirname } from "path";
import type {
  ApprovalDecision,
  DebtRecord,
  FrontedPayment,
  PurchaseRequest,
  ReputationEvent,
  User
} from "@proof/domain";
import { getDbPath } from "./paths";

export type Database = {
  users: User[];
  requests: PurchaseRequest[];
  approvals: ApprovalDecision[];
  payments: FrontedPayment[];
  debts: DebtRecord[];
  reputationEvents: ReputationEvent[];
};

const empty: Database = {
  users: [],
  requests: [],
  approvals: [],
  payments: [],
  debts: [],
  reputationEvents: []
};

let writeChain: Promise<void> = Promise.resolve();

async function readRaw(): Promise<Database> {
  const p = getDbPath();
  if (!existsSync(p)) return structuredClone(empty);
  const raw = await readFile(p, "utf8");
  return { ...empty, ...JSON.parse(raw) };
}

export async function loadDb(): Promise<Database> {
  return readRaw();
}

export async function saveDb(db: Database): Promise<void> {
  const p = getDbPath();
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(db, null, 2), "utf8");
}

export function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeChain.then(fn, fn);
  writeChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export async function mutateDb(mutator: (db: Database) => void): Promise<Database> {
  return withLock(async () => {
    const db = await readRaw();
    mutator(db);
    await saveDb(db);
    return db;
  });
}
