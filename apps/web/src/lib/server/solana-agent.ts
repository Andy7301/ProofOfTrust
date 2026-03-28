import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { serverEnv } from "./env";

export function loadSolanaAgentKeypair(): Keypair | null {
  const raw = serverEnv.solanaAgentPrivateKey;
  if (!raw?.trim()) return null;
  const t = raw.trim();
  try {
    if (t.startsWith("[")) {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(t) as number[]));
    }
    if ((t.startsWith("0x") || t.startsWith("0X")) && t.length === 66) {
      return Keypair.fromSecretKey(Uint8Array.from(Buffer.from(t.slice(2), "hex")));
    }
    if (/^[0-9a-fA-F]{128}$/.test(t)) {
      return Keypair.fromSecretKey(Uint8Array.from(Buffer.from(t, "hex")));
    }
    return Keypair.fromSecretKey(bs58.decode(t));
  } catch {
    return null;
  }
}

export function getSolanaAgentPublicKeyBase58(): string | null {
  const kp = loadSolanaAgentKeypair();
  return kp ? kp.publicKey.toBase58() : null;
}
