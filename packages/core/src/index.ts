import { z } from "zod";

export const policyConfigSchema = z.object({
  maxCreditLimit: z.number().positive(),
  maxRequestAmount: z.number().positive(),
  minTrustAutoApprove: z.number().min(0).max(1)
});

export type PolicyConfig = z.infer<typeof policyConfigSchema>;

export const defaultPolicyConfig: PolicyConfig = {
  maxCreditLimit: 300,
  maxRequestAmount: 120,
  minTrustAutoApprove: 0.65
};
