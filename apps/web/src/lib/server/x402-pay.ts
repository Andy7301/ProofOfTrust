import { wrap, WrappedFetchError } from "@faremeter/fetch";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { isMockSolanaX402, serverEnv } from "./env";
import { loadSolanaAgentKeypair } from "./solana-agent";

const DEVNET_USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export type PaidFetchResult = {
  ok: boolean;
  status: number;
  bodyText: string;
  x402Status: "PAID" | "FAILED";
  /** Solana signature when settlement-account x402 path submitted a tx (see demo `extra.features`). */
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
        summary: "Mock x402: no on-chain payment (set SOLANA_AGENT_PRIVATE_KEY and not SOLANA_X402_MODE=mock for real).",
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

  let lastSubmittedSignature: string | undefined;

  const connection = new Connection(serverEnv.solanaRpcUrl, "confirmed");
  const wallet = {
    network: "solana-devnet" as const,
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

  const handler = createPaymentHandler(wallet, DEVNET_USDC_MINT, connection, {
    features: { enableSettlementAccounts: true }
  });

  const paidFetch = wrap(fetch, {
    handlers: [handler],
    phase1Fetch: fetch,
    retryCount: 2
  });

  try {
    const res = await paidFetch(targetUrl);
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
