export const userSummary = {
  displayName: "Avery Chen",
  tronAddress: "TN8x...4z9Q",
  reputationScore: 0.78,
  creditLimit: 240,
  outstandingDebt: 54,
  repaymentRate: 92
};

export const latestRequest = {
  description: "Need premium API summary for competitor intel brief.",
  targetService: "x402 /premium/research-brief",
  requestedAmount: 18,
  urgency: "HIGH",
  aiConfidence: 0.86,
  suspicionFlags: ["edited_receipt_metadata"]
};

export const decisionSnapshot = {
  result: "APPROVED",
  trustScore: 0.74,
  reasons: [
    "Strong repayment history in the last 30 days.",
    "Requested amount is within dynamic credit capacity.",
    "One mild suspicion flag triggered extra confidence penalty."
  ]
};

export const timelineEvents = [
  {
    title: "Purchase Request Submitted",
    subtitle: "User asks for Solana x402 premium endpoint access.",
    state: "complete",
    meta: "2 min ago"
  },
  {
    title: "AI Verification Complete",
    subtitle: "Gemini multimodal parser returned normalized structured output.",
    state: "complete",
    meta: "1 min ago"
  },
  {
    title: "Trust + Policy Decision",
    subtitle: "Risk engine approves short-term credit fronting.",
    state: "complete",
    meta: "45 sec ago"
  },
  {
    title: "ProofOfTrust x402 Solana Payment",
    subtitle: "Agent wallet pays to unlock paid HTTP response.",
    state: "active",
    meta: "in progress"
  },
  {
    title: "Debt Ledger + TRON Repayment",
    subtitle: "Debt recorded and awaiting Nile testnet repayment.",
    state: "pending",
    meta: "next"
  }
] as const;

export const aiExtractedSample = {
  merchantOrService: "Premium Research API",
  claimedAmount: 18,
  category: "market-intelligence",
  confidence: 0.86,
  suspiciousFlags: ["edited_receipt_metadata"],
  extractedJustification:
    "User needs high-quality paid intelligence output for immediate product decision support."
};
