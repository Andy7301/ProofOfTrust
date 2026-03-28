import { TronWeb } from "tronweb";
import { isMockTronRepay, serverEnv } from "./env";

export async function verifyTronRepaymentTx(txHash: string): Promise<boolean> {
  const h = txHash.trim();
  if (!h) return false;
  if (isMockTronRepay()) return h.length >= 8;

  try {
    const tw = new TronWeb({ fullHost: serverEnv.tronRpcUrl });
    const tx = await tw.trx.getTransaction(h);
    return Boolean(tx && typeof tx === "object" && "txID" in tx && Boolean((tx as { txID?: string }).txID));
  } catch {
    return false;
  }
}
