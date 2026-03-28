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

export async function extractPurchaseSignals(input: {
  description: string;
  requestedAmount: number;
}): Promise<AiExtractedData> {
  if (isMockAi()) {
    const d = input.description.toLowerCase();
    const suspiciousFlags: string[] = [];
    if (d.includes("review")) suspiciousFlags.push("manual_review_keyword");
    return {
      merchantOrService: "Parsed Service",
      claimedAmount: input.requestedAmount,
      category: "api-access",
      confidence: d.includes("reject") || d.includes("fraud") ? 0.42 : 0.84,
      suspiciousFlags,
      extractedJustification: "Simulated extraction (AI_PROVIDER=mock)."
    };
  }

  const key = serverEnv.geminiApiKey!;
  const ai = new GoogleGenAI({ apiKey: key });
  const prompt = `You extract structured data for a B2B purchase fronting request. Return ONLY valid JSON with keys:
merchantOrService (string), claimedAmount (number), category (string), confidence (0-1), suspiciousFlags (string[]), extractedJustification (string).
Description: ${JSON.stringify(input.description)}
Requested amount (USD-ish): ${input.requestedAmount}`;

  const res = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt
  });
  const text = res.text?.trim() ?? "";
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
