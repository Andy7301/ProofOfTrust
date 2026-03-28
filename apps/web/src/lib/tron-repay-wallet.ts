/**
 * Build + sign + broadcast a native TRX transfer via TronLink (`window.tronWeb`).
 */

export class TronRepayBroadcastError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TronRepayBroadcastError";
  }
}

export async function broadcastTronTrxRepayment(opts: {
  from: string;
  to: string;
  amountSun: number;
}): Promise<string> {
  if (typeof window === "undefined") {
    throw new TronRepayBroadcastError("Repayment must run in the browser with TronLink.");
  }

  const tw = window.tronWeb;
  if (!tw) {
    throw new TronRepayBroadcastError("TronWeb not found — install TronLink and refresh.");
  }

  for (let i = 0; i < 30; i++) {
    if (tw.ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!tw.ready) {
    throw new TronRepayBroadcastError("TronWeb not ready — unlock TronLink.");
  }

  if (!Number.isFinite(opts.amountSun) || opts.amountSun < 1) {
    throw new TronRepayBroadcastError("Invalid repayment amount.");
  }

  if (!tw.transactionBuilder?.sendTrx) {
    throw new TronRepayBroadcastError(
      "TronWeb.transactionBuilder.sendTrx is missing — use a recent TronLink build."
    );
  }
  if (!tw.trx?.sign || !tw.trx.sendRawTransaction) {
    throw new TronRepayBroadcastError("TronWeb.trx API missing — unlock TronLink.");
  }

  const unsigned = await tw.transactionBuilder.sendTrx(
    opts.to,
    opts.amountSun,
    opts.from,
    { feeLimit: 80_000_000 }
  );

  const signedTx = await tw.trx.sign(unsigned);
  const out = await tw.trx.sendRawTransaction(signedTx);

  const o = out as {
    result?: boolean;
    code?: string;
    message?: string;
    txid?: string;
    transaction?: { txID?: string };
  };

  if (!o?.result) {
    const detail = o?.message || o?.code || "Broadcast failed";
    throw new TronRepayBroadcastError(
      typeof detail === "string" ? detail : JSON.stringify(detail)
    );
  }

  const id = o.txid || o.transaction?.txID;
  if (!id || typeof id !== "string") {
    throw new TronRepayBroadcastError("No transaction id returned.");
  }
  return id;
}
