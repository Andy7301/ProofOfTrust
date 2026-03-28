/** Base58 treasury that receives TRX repayments (required for real wallet repay + verification). */
export function getTronRepayTreasuryBase58(): string | null {
  const a = process.env.TRON_REPAY_RECEIVER?.trim();
  return a || null;
}

/**
 * Sun (1 TRX = 1e6 sun) charged per $1 of debt (USD units in the app).
 * Default: 100_000 sun = 0.1 TRX per $1 — adjust for production.
 */
export function sunPerDebtDollar(): number {
  const raw = process.env.TRON_SUN_PER_DEBT_DOLLAR?.trim();
  const n = raw ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 1) return Math.floor(n);
  return 100_000;
}

export function debtUsdToRepaySun(debtAmountUsd: number): number {
  const per = sunPerDebtDollar();
  const sun = Math.ceil(Math.max(0, debtAmountUsd) * per);
  return Math.max(sun, 1);
}
