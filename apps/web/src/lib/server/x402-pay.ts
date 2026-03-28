import { wrap, WrappedFetchError } from "@faremeter/fetch";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { isMockSolanaX402, serverEnv, solanaX402MockReason } from "./env";
import { loadSolanaAgentKeypair } from "./solana-agent";
import { getSolanaUsdcMintBase58, getSolanaX402Network } from "./solana-x402-config";

/** Must match demo route `accepts[].amount` (USDC smallest units, 6 decimals). */
function requiredUsdcMicros(): bigint {
  const raw = process.env.SOLANA_X402_PAYMENT_MICRO_USDC?.trim();
  const n = raw ? BigInt(raw) : 1000n;
  return n > 0n ? n : 1000n;
}

function resolveAbsoluteTargetUrl(targetUrl: string): string {
  const u = targetUrl.trim();
  if (/^https?:\/\//i.test(u)) return u;
  const base = (serverEnv.nextPublicBaseUrl || "http://localhost:3000").replace(/\/$/, "");
  const path = u.startsWith("/") ? u : `/${u}`;
  return `${base}${path}`;
}

export type PaidFetchResult = {
  ok: boolean;
  status: number;
  bodyText: string;
  x402Status: "PAID" | "FAILED";
  transactionSignature?: string;
  error?: string;
};

/**
 * Calls a URL that may return 402 + x402 v2; pays via Faremeter + Solana exact when not in mock mode.
 */
export async function executePaidFetch(targetUrl: string): Promise<PaidFetchResult> {
  if (isMockSolanaX402()) {
    return {
      ok: true,
      status: 200,
      bodyText: JSON.stringify({
        mode: "mock",
        reason: solanaX402MockReason(),
        summary:
          "No on-chain USDC was spent — add SOLANA_AGENT_PRIVATE_KEY (and ensure SOLANA_X402_DISABLE is not 1).",
        target: targetUrl
      }),
      x402Status: "PAID"
    };
  }

  const kp = loadSolanaAgentKeypair();
  if (!kp) {
    return {
      ok: false,
      status: 0,
      bodyText: "",
      x402Status: "FAILED",
      error: "SOLANA_AGENT_PRIVATE_KEY missing or invalid"
    };
  }

  const url = resolveAbsoluteTargetUrl(targetUrl);
  const mintPk = new PublicKey(getSolanaUsdcMintBase58());
  const networkId = getSolanaX402Network();
  const needMicros = requiredUsdcMicros();

  const connection = new Connection(serverEnv.solanaRpcUrl, "confirmed");

  try {
    const lamports = await connection.getBalance(kp.publicKey);
    if (lamports < 2_000_000) {
      return {
        ok: false,
        status: 0,
        bodyText: "",
        x402Status: "FAILED",
        error: `Agent SOL balance too low (${lamports} lamports). Fund ${kp.publicKey.toBase58()} on this cluster for fees.`
      };
    }

    const ata = getAssociatedTokenAddressSync(
      mintPk,
      kp.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const bal = await connection.getTokenAccountBalance(ata).catch(() => null);
    if (!bal) {
      return {
        ok: false,
        status: 0,
        bodyText: "",
        x402Status: "FAILED",
        error: `No USDC token account for agent. Create/fund ATA ${ata.toBase58()} (mint ${mintPk.toBase58()}).`
      };
    }
    if (BigInt(bal.value.amount) < needMicros) {
      return {
        ok: false,
        status: 0,
        bodyText: "",
        x402Status: "FAILED",
        error: `Agent USDC balance too low: ${bal.value.uiAmountString} at ${ata.toBase58()} (need ≥ ${needMicros} micro-units).`
      };
    }

    await getMint(connection, mintPk);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      status: 0,
      bodyText: "",
      x402Status: "FAILED",
      error: `Solana preflight failed: ${msg}`
    };
  }

  let lastSubmittedSignature: string | undefined;

  const wallet = {
    network: networkId,
    publicKey: kp.publicKey,
    partiallySignTransaction: async (tx: VersionedTransaction) => {
      tx.sign([kp]);
      return tx;
    },
    sendTransaction: async (tx: VersionedTransaction) => {
      const sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        maxRetries: 3
      });
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature: sig, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
        "confirmed"
      );
      lastSubmittedSignature = sig;
      return sig;
    }
  };

  const handler = createPaymentHandler(wallet, mintPk, connection, {
    features: { enableSettlementAccounts: true }
  });

  const paidFetch = wrap(fetch, {
    handlers: [handler],
    phase1Fetch: fetch,
    retryCount: 2
  });

  try {
    const res = await paidFetch(url);
    const bodyText = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      bodyText,
      x402Status: res.ok ? "PAID" : "FAILED",
      transactionSignature: lastSubmittedSignature,
      error: res.ok ? undefined : `HTTP ${res.status}`
    };
  } catch (e) {
    if (e instanceof WrappedFetchError) {
      const bodyText = await e.response.text().catch(() => "");
      return {
        ok: false,
        status: e.response.status,
        bodyText,
        x402Status: "FAILED",
        transactionSignature: lastSubmittedSignature,
        error: "Payment flow exhausted retries"
      };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      status: 0,
      bodyText: "",
      x402Status: "FAILED",
      transactionSignature: lastSubmittedSignature,
      error: msg
    };
  }
}
