import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { loadDb, mutateDb } from "@/lib/server/db";
import { getTronAddress } from "@/lib/server/auth";
import { genId, nowIso } from "@/lib/server/ids";
import { runPurchasePipeline } from "@/lib/server/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

const createSchema = z.object({
  description: z.string().min(1).max(8000),
  targetService: z.string().url(),
  requestedAmount: z.number().positive().max(1_000_000),
  urgency: z.enum(["NORMAL", "HIGH", "URGENT"])
});

export async function GET(req: NextRequest) {
  const tron = getTronAddress(req);
  if (!tron) {
    return NextResponse.json({ error: "Missing X-Tron-Address" }, { status: 401 });
  }
  const db = await loadDb();
  const user = db.users.find((u) => u.tronAddress === tron);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const requests = db.requests.filter((r) => r.userId === user.id);
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const tron = getTronAddress(req);
  if (!tron) {
    return NextResponse.json({ error: "Missing X-Tron-Address" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db0 = await loadDb();
  const user0 = db0.users.find((u) => u.tronAddress === tron);
  if (!user0) {
    return NextResponse.json({ error: "User not found — POST /api/session first" }, { status: 404 });
  }

  const requestId = genId("req");
  const t = nowIso();

  await mutateDb((db) => {
    const user = db.users.find((u) => u.tronAddress === tron);
    if (!user) return;
    db.requests.unshift({
      id: requestId,
      userId: user.id,
      description: parsed.data.description,
      targetService: parsed.data.targetService,
      requestedAmount: parsed.data.requestedAmount,
      urgency: parsed.data.urgency,
      suspicionFlags: [],
      status: "PENDING",
      createdAt: t,
      updatedAt: t
    });
  });

  after(() => runPurchasePipeline(requestId));

  return NextResponse.json({ id: requestId });
}
