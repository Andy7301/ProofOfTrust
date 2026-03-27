/**
 * Visual “portal / bridge” rail: TRON (origin) → Solana (destination).
 * Purely decorative storytelling for the cross-chain flow.
 */
export function BridgeRail() {
  return (
    <div className="bridge-rail max-w-md">
      <div className="bridge-rail__node bridge-rail__node--tron" title="TRON — funds & repayment">
        T
      </div>
      <div className="bridge-rail__track" aria-hidden />
      <div className="bridge-rail__node bridge-rail__node--solana" title="Solana — x402 paid API">
        S
      </div>
    </div>
  );
}
