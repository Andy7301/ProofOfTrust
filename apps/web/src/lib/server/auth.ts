import type { NextRequest } from "next/server";

export function getTronAddress(req: NextRequest): string | null {
  const h = req.headers.get("x-tron-address")?.trim();
  return h || null;
}
