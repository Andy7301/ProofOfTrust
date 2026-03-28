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

function readAddressFromTronWeb(): string | null {
  const tw = window.tronWeb;
  if (!tw?.defaultAddress?.base58) return null;
  return tw.defaultAddress.base58;
}

/**
 * Prompts TronLink for accounts and returns the selected base58 TRON address.
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
      if (res && typeof res === "object" && "code" in res) {
        const code = (res as { code?: number }).code;
        if (code === 4001) {
          throw new TronLinkError("Connection rejected in TronLink.");
        }
      }
    } catch (e) {
      if (e instanceof TronLinkError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      throw new TronLinkError(msg || "TronLink request failed.");
    }
  }

  const fromTw = readAddressFromTronWeb();
  if (fromTw) return fromTw;

  throw new TronLinkError(
    "TronLink not found. Install the extension from tronlink.org and refresh this page."
  );
}
