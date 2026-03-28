import type { User } from "@proof/domain";
import { nowIso } from "./ids";

export function createUser(tronAddress: string): User {
  const t = nowIso();
  return {
    id: `u_${tronAddress}`,
    displayName: `User ${tronAddress.slice(0, 6)}…`,
    tronAddress,
    reputationScore: 0.78,
    creditLimit: 240,
    outstandingDebt: 0,
    createdAt: t,
    updatedAt: t
  };
}
