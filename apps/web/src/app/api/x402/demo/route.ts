import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSolanaAgentPublicKeyBase58 } from "@/lib/server/solana-agent";

export const runtime = "nodejs";

/**
 * x402 v2 header names (same as `@faremeter/types/x402v2`).
 * Inlined so this route does not bundle `@faremeter/types` / arktype — that was causing flaky
 * webpack chunk errors (`Cannot find module './773.js'`) in dev.
 */
const PAYMENT_SIGNATURE = "PAYMENT-SIGNATURE";
const PAYMENT_REQUIRED = "PAYMENT-REQUIRED";

/** Devnet USDC mint (SPL) — Faremeter `exact` scheme uses token address as `asset`. */
const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

type PaymentRequiredV2 = {
  x402Version: 2;
  resource: {
    url: string;
    description?: string;
    mimeType?: string;
  };
  accepts: Array<{
    scheme: string;
    network: string;
    amount: string;
    asset: string;
    payTo: string;
    maxTimeoutSeconds: number;
    extra?: object;
  }>;
  error?: string;
};

function getDemoPayTo(): string {
  const addr = process.env.NEXT_PUBLIC_X402_DEMO_PAY_TO?.trim();
  if (addr) return addr;
  /** Placeholder — replace with your devnet wallet that should receive USDC for real tests. */
  return "11111111111111111111111111111212";
}

function buildPaymentRequired(req: NextRequest): PaymentRequiredV2 {
  const u = new URL(req.url);
  const resourceUrl = `${u.protocol}//${u.host}${u.pathname}`;

  const feePayer = getSolanaAgentPublicKeyBase58();
  const accept: PaymentRequiredV2["accepts"][0] = {
    scheme: "exact",
    network: "solana-devnet",
    /** Smallest units (USDC has 6 decimals) — 0.001 USDC for cheap demos */
    amount: "1000",
    asset: DEVNET_USDC_MINT,
    payTo: getDemoPayTo(),
    maxTimeoutSeconds: 120
  };

  /** Lets `@faremeter/payment-solana` use settlement mode so we submit a tx and get a trackable signature. */
  if (feePayer) {
    accept.extra = {
      feePayer,
      features: {
        xSettlementAccountSupported: true
      }
    };
  }

  return {
    x402Version: 2,
    resource: {
      url: resourceUrl,
      description: "ProofOfTrust demo: premium JSON (x402 + Solana devnet)",
      mimeType: "application/json"
    },
    accepts: [accept]
  };
}

function encodeHeaderPayload(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

function tryDecodePaymentSignature(header: string | null): { ok: boolean; raw?: unknown } {
  if (!header?.trim()) return { ok: false };
  try {
    const json = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    if (json && typeof json === "object" && (json as { x402Version?: number }).x402Version === 2) {
      return { ok: true, raw: json };
    }
  } catch {
    return { ok: false };
  }
  return { ok: false };
}

/**
 * Demo x402 endpoint (Faremeter / x402 v2 header flow).
 *
 * 1) First GET → `402` + `PAYMENT-REQUIRED` header (base64 JSON).
 * 2) Client pays (e.g. `@faremeter/fetch` + `@faremeter/payment-solana`) and retries with `PAYMENT-SIGNATURE`.
 * 3) This handler **does not** verify on-chain settlement (use a facilitator in production).
 *    For the hackathon we accept a well-formed v2 payload so the UI can be exercised end-to-end.
 */
export async function GET(request: NextRequest) {
  const bypass =
    process.env.X402_DEMO_BYPASS === "1" ||
    (process.env.NODE_ENV === "development" && request.nextUrl.searchParams.get("bypass") === "1");

  if (bypass) {
    return NextResponse.json({
      demo: true,
      message: "Bypass mode — no payment (set X402_DEMO_BYPASS=1 or ?bypass=1 in development only).",
      data: {
        insight: "Simulated premium result: cross-chain trust scores up only after repayment.",
        timestamp: new Date().toISOString()
      }
    });
  }

  const sig = request.headers.get(PAYMENT_SIGNATURE) ?? request.headers.get("payment-signature");

  const parsed = tryDecodePaymentSignature(sig);
  if (parsed.ok) {
    return NextResponse.json(
      {
        paid: true,
        message: "x402 demo: payment header accepted (settlement not verified on-chain in this demo).",
        data: {
          insight: "Premium API payload unlocked after PAYMENT-SIGNATURE.",
          echo: parsed.raw,
          timestamp: new Date().toISOString()
        }
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  const body = buildPaymentRequired(request);
  const headerValue = encodeHeaderPayload(body);

  return new NextResponse(
    JSON.stringify({
      error: "Payment required",
      hint: "Retry GET with PAYMENT-SIGNATURE after paying per x402 v2 (see PAYMENT-REQUIRED header)."
    }),
    {
      status: 402,
      headers: {
        [PAYMENT_REQUIRED]: headerValue,
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": `${PAYMENT_SIGNATURE}, Content-Type`
    }
  });
}
