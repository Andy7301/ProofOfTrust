import { defaultPolicyConfig } from "@proof/core";
import type { User } from "@proof/domain";

/** Maximum USD for one purchase request: policy ceiling and remaining credit headroom (see server `decision.ts`). */
export function perRequestMaxUsd(user: User): number {
  const policyCap = defaultPolicyConfig.maxRequestAmount;
  const headroom = Math.max(0, user.creditLimit - user.outstandingDebt);
  return Math.min(policyCap, headroom);
}
