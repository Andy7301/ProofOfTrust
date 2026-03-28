import { TronWeb } from "tronweb";
import { isMockTronRepay, serverEnv } from "./env";

function toBase58Address(tw: InstanceType<typeof TronWeb>, raw: string): string {
  const t = raw.trim();
  if (/^T[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(t)) return t;
  try {
    return tw.address.fromHex(t);
  } catch {
    return t;
  }
}

type TransferContractValue = {
  amount?: number;
  owner_address?: string;
  to_address?: string;
};

type TronTxInspect = {
  txID?: string;
  ret?: Array<{ contractRet?: string }>;
  raw_data?: {
    contract?: Array<{
      type?: string;
      parameter?: { value?: TransferContractValue };
    }>;
  };
};

export type TronRepayVerifyCtx = {
  payerBase58: string;
  treasuryBase58: string;
  minSun: number;
};

function contractRetOk(ret: TronTxInspect["ret"]): boolean {
  const s = ret?.[0]?.contractRet;
  if (!s) return true;
  return String(s).toUpperCase() === "SUCCESS";
}

export async function verifyTronRepaymentTx(
  txHash: string,
  ctx?: TronRepayVerifyCtx
): Promise<boolean> {
  const h = txHash.trim();
  if (!h) return false;
  if (isMockTronRepay()) return h.length >= 8;

  try {
    const tw = new TronWeb({ fullHost: serverEnv.tronRpcUrl });
    const tx = (await tw.trx.getTransaction(h)) as TronTxInspect;
    if (!tx?.txID) return false;
    if (!contractRetOk(tx.ret)) return false;

    if (!ctx) {
      return true;
    }

    const c = tx.raw_data?.contract?.[0];
    if (!c || c.type !== "TransferContract" || !c.parameter?.value) return false;

    const v = c.parameter.value;
    const amount = Number(v.amount);
    if (!Number.isFinite(amount) || amount < ctx.minSun) return false;

    const ownerHex = v.owner_address;
    const toHex = v.to_address;
    if (!ownerHex || !toHex) return false;

    const from = toBase58Address(tw, ownerHex);
    const to = toBase58Address(tw, toHex);

    if (from !== ctx.payerBase58) return false;
    if (to !== ctx.treasuryBase58) return false;

    return true;
  } catch {
    return false;
  }
}
