import type { AiExtractedData } from "@proof/domain";
import { GoogleGenAI } from "@google/genai";
import { isMockAi, serverEnv } from "./env";

const MOCK_FALLBACK: AiExtractedData = {
  merchantOrService: "Unknown service",
  claimedAmount: 0,
  category: "general",
  confidence: 0.75,
  suspiciousFlags: [],
  extractedJustification: "Mock AI extraction (no GEMINI_API_KEY)."
};

const GEMINI_TIMEOUT_MS = 55_000;
const GEMINI_429_RETRY_DELAY_MS = 6_500;
const GEMINI_429_MAX_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** Same shape as the mock path — used for AI_PROVIDER=mock and Gemini quota fallback. */
export function heuristicExtraction(
  input: { description: string; requestedAmount: number },
  extractedJustification: string
): AiExtractedData {
  const d = input.description.toLowerCase();
  const suspiciousFlags: string[] = [];
  if (d.includes("review")) suspiciousFlags.push("manual_review_keyword");
  return {
    merchantOrService: "Parsed Service",
    claimedAmount: input.requestedAmount,
    category: "api-access",
    confidence: d.includes("reject") || d.includes("fraud") ? 0.42 : 0.84,
    suspiciousFlags,
    extractedJustification
  };
}

function isGemini429OrQuota(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const o = err as { status?: number; message?: string };
  if (o.status === 429) return true;
  const msg = String(o.message ?? err);
  return /RESOURCE_EXHAUSTED|"code":\s*429|quota exceeded|rate limit|GenerateRequestsPerDay/i.test(msg);
}

function parseGeminiJson(text: string, input: { requestedAmount: number }): AiExtractedData {
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const slice =
      jsonStart >= 0 && jsonEnd > jsonStart ? text.slice(jsonStart, jsonEnd + 1) : text;
    const parsed = JSON.parse(slice) as Partial<AiExtractedData>;
    return {
      merchantOrService: String(parsed.merchantOrService ?? MOCK_FALLBACK.merchantOrService),
      claimedAmount: Number(parsed.claimedAmount ?? input.requestedAmount),
      category: String(parsed.category ?? "general"),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence ?? 0.7))),
      suspiciousFlags: Array.isArray(parsed.suspiciousFlags)
        ? parsed.suspiciousFlags.map(String)
        : [],
      extractedJustification: String(
        parsed.extractedJustification ?? "Gemini extraction."
      )
    };
  } catch {
    return { ...MOCK_FALLBACK, claimedAmount: input.requestedAmount };
  }
}

async function generateContentWithTimeout(
  ai: GoogleGenAI,
  model: string,
  prompt: string
): Promise<{ text?: string }> {
  return Promise.race([
    ai.models.generateContent({ model, contents: prompt }),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Gemini timed out after ${GEMINI_TIMEOUT_MS}ms`)),
        GEMINI_TIMEOUT_MS
      );
    })
  ]);
}

export async function extractPurchaseSignals(input: {
  description: string;
  requestedAmount: number;
}): Promise<AiExtractedData> {
  if (isMockAi()) {
    return heuristicExtraction(
      input,
      "Simulated extraction (AI_PROVIDER=mock)."
    );
  }

  const key = serverEnv.geminiApiKey!;
  const ai = new GoogleGenAI({ apiKey: key });
  const model = serverEnv.geminiModel;
  const prompt = `You extract structured data for a B2B purchase fronting request. Return ONLY valid JSON with keys:
merchantOrService (string), claimedAmount (number), category (string), confidence (0-1), suspiciousFlags (string[]), extractedJustification (string).
Description: ${JSON.stringify(input.description)}
Requested amount (USD-ish): ${input.requestedAmount}`;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= GEMINI_429_MAX_ATTEMPTS; attempt++) {
    try {
      const res = await generateContentWithTimeout(ai, model, prompt);
      const text = res.text?.trim() ?? "";
      return parseGeminiJson(text, input);
    } catch (err) {
      lastErr = err;
      const quota = isGemini429OrQuota(err);
      if (quota && attempt < GEMINI_429_MAX_ATTEMPTS) {
        console.warn(
          `[extractPurchaseSignals] Gemini 429/quota (attempt ${attempt}/${GEMINI_429_MAX_ATTEMPTS}), retrying in ${GEMINI_429_RETRY_DELAY_MS}ms`
        );
        await sleep(GEMINI_429_RETRY_DELAY_MS);
        continue;
      }
      if (quota && !serverEnv.geminiStrictQuota) {
        console.warn(
          "[extractPurchaseSignals] Gemini quota exhausted after retries — using heuristic extraction. Enable billing or set GEMINI_MODEL to a model with quota; see https://ai.google.dev/gemini-api/docs/rate-limits"
        );
        return heuristicExtraction(
          input,
          "Gemini returned 429 / quota exceeded; using heuristic extraction until billing or quotas are fixed."
        );
      }
      throw err;
    }
  }

  throw lastErr;
}
