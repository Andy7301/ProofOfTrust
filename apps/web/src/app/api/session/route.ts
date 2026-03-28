import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { mutateDb } from "@/lib/server/db";
import { createUser } from "@/lib/server/users";

export const runtime = "nodejs";

const bodySchema = z.object({
  tronAddress: z.string().min(8).max(128)
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { tronAddress } = parsed.data;

  await mutateDb((db) => {
    const existing = db.users.find((u) => u.tronAddress === tronAddress);
    if (!existing) {
      db.users.push(createUser(tronAddress));
    }
  });

  return NextResponse.json({ ok: true });
}
