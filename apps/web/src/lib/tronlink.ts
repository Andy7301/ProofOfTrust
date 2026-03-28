/**
 * TronLink browser extension (window.tronLink / window.tronWeb).
 * @see https://developers.tron.network/docs/tronlink-intro
 */

export class TronLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TronLinkError";
  }
}

function readAddressFromInjectedTronWeb(): string | null {
  const fromLink = window.tronLink?.tronWeb?.defaultAddress?.base58;
  if (fromLink) return fromLink;
  const tw = window.tronWeb;
  if (!tw?.defaultAddress?.base58) return null;
  return tw.defaultAddress.base58;
}

async function waitForTronWebAddress(maxMs: number): Promise<string | null> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const a = readAddressFromInjectedTronWeb();
    if (a) return a;
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

function parseRequestAccountsResult(res: unknown): void {
  if (Array.isArray(res)) {
    if (!res[0] || typeof res[0] !== "string") {
      throw new TronLinkError("TronLink: no account selected.");
    }
    return;
  }
  if (res && typeof res === "object" && "code" in res) {
    const code = (res as { code?: number }).code;
    if (code === 4001) {
      throw new TronLinkError("Connection rejected in TronLink.");
    }
    if (code !== undefined && code !== 200) {
      throw new TronLinkError(`TronLink request failed (code ${String(code)}).`);
    }
  }
}

/**
 * Prompts TronLink for accounts (authorization popup when the site is new) and
 * returns the selected base58 TRON address. Prefer {@link window.tronLink.tronWeb}
 * after `tron_requestAccounts` — TronLink often returns `{ code: 200 }` instead of
 * an address array; reading only `window.tronWeb` skipped the real connect flow.
 */
export async function requestTronLinkAddress(): Promise<string> {
  if (typeof window === "undefined") {
    throw new TronLinkError("Wallet connection requires a browser.");
  }

  const tl = window.tronLink;
  if (tl?.request) {
    try {
      const res = await tl.request({ method: "tron_requestAccounts" });
      if (Array.isArray(res) && typeof res[0] === "string" && res[0].length > 0) {
        return res[0];
      }
      parseRequestAccountsResult(res);
    } catch (e) {
      if (e instanceof TronLinkError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      throw new TronLinkError(msg || "TronLink request failed.");
    }

    const polled = await waitForTronWebAddress(5_000);
    if (polled) return polled;

    throw new TronLinkError(
      "TronLink did not expose an account — unlock the extension and try again."
    );
  }

  const fromTw = readAddressFromInjectedTronWeb();
  if (fromTw) return fromTw;

  throw new TronLinkError(
    "TronLink not found. Install the extension from tronlink.org and refresh this page."
  );
}
