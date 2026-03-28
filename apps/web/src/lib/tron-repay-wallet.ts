/**
 * Build + sign + broadcast a native TRX transfer via TronLink.
 * Prefer `window.tronLink.tronWeb` (injected API) over bare `window.tronWeb` so the
 * wallet’s full node + signing hooks are wired — otherwise `sendTrx` can hang before
 * any signing popup appears.
 * @see https://docs.tronlink.org/dapp/getting-started
 */

export class TronRepayBroadcastError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TronRepayBroadcastError";
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(
        new TronRepayBroadcastError(
          `${label} timed out after ${Math.round(ms / 1000)}s. Check TronLink is unlocked, the correct network is selected, and try again.`
        )
      );
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e instanceof Error ? e : new TronRepayBroadcastError(String(e)));
      }
    );
  });
}

type TronWebLike = NonNullable<typeof window.tronWeb>;

/**
 * TronLink injects `tronLink.tronWeb` — that instance is the one wired for RPC + signing.
 */
async function getTronWebFromExtension(): Promise<TronWebLike> {
  const tl = window.tronLink;
  if (tl) {
    if (!tl.ready) {
      const res = await tl.request({ method: "tron_requestAccounts" });
      if (Array.isArray(res)) {
        if (!res[0]) {
          throw new TronRepayBroadcastError("TronLink: no account selected.");
        }
      } else if (res && typeof res === "object" && "code" in res) {
        const code = (res as { code?: number }).code;
        if (code === 4001) {
          throw new TronRepayBroadcastError("TronLink connection rejected.");
        }
        if (code !== undefined && code !== 200) {
          throw new TronRepayBroadcastError(`TronLink request failed (code ${String(code)}).`);
        }
      }
    }
    const tw = tl.tronWeb;
    if (tw) {
      return tw;
    }
  }

  const fallback = window.tronWeb;
  if (!fallback) {
    throw new TronRepayBroadcastError("TronWeb not found — install TronLink and refresh.");
  }
  return fallback;
}

async function waitForDefaultAddress(tw: TronWebLike, maxMs: number): Promise<void> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (tw.defaultAddress?.base58) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new TronRepayBroadcastError(
    "No TRON account in TronLink — unlock the extension and select an account."
  );
}

export async function broadcastTronTrxRepayment(opts: {
  from: string;
  to: string;
  amountSun: number;
}): Promise<string> {
  if (typeof window === "undefined") {
    throw new TronRepayBroadcastError("Repayment must run in the browser with TronLink.");
  }

  const tw = await getTronWebFromExtension();

  await waitForDefaultAddress(tw, 8_000);

  const liveFrom = tw.defaultAddress?.base58;
  if (!liveFrom) {
    throw new TronRepayBroadcastError("TronLink has no active address.");
  }
  if (liveFrom !== opts.from) {
    throw new TronRepayBroadcastError(
      `Active TronLink account (${liveFrom.slice(0, 6)}…) does not match this app’s connected address (${opts.from.slice(0, 6)}…). Switch to the connected account in TronLink.`
    );
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

  const unsigned = await withTimeout(
    tw.transactionBuilder.sendTrx(opts.to, opts.amountSun, opts.from, { feeLimit: 80_000_000 }),
    60_000,
    "Building TRX transfer (node RPC)"
  );

  const signedTx = await withTimeout(tw.trx.sign(unsigned), 180_000, "TronLink signing");

  const out = await withTimeout(tw.trx.sendRawTransaction(signedTx), 45_000, "Broadcasting transaction");

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
