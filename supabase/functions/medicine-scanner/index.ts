import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ConfidenceLevel = "low" | "medium" | "high";

interface MedicineAnalysisResult {
  medicineName: string | null;
  manufacturer: string | null;
  uses: string[];
  conditionsTreated: string[];
  activeIngredients: string[];
  drugClass: string | null;
  commonSideEffects: string[];
  importantPrecautions: string[];
  confidence: ConfidenceLevel;
  summary: string;
  extractedText: string;
  ocrConfidence: number;
}

function parseJsonObject(rawText: string): Record<string, unknown> {
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Failed to parse Gemini response");
    }
    return JSON.parse(match[0]);
  }
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeConfidence(value: unknown): ConfidenceLevel {
  if (typeof value !== "string") return "low";
  const normalized = value.trim().toLowerCase();
  if (normalized === "high" || normalized === "medium") return normalized;
  return "low";
}

function normalizeResponse(payload: Record<string, unknown>, extractedText: string, ocrConfidence: number): MedicineAnalysisResult {
  return {
    medicineName: toNullableString(payload.medicineName),
    manufacturer: toNullableString(payload.manufacturer),
    uses: toStringList(payload.uses),
    conditionsTreated: toStringList(payload.conditionsTreated),
    activeIngredients: toStringList(payload.activeIngredients),
    drugClass: toNullableString(payload.drugClass),
    commonSideEffects: toStringList(payload.commonSideEffects),
    importantPrecautions: toStringList(payload.importantPrecautions),
    confidence: normalizeConfidence(payload.confidence),
    summary: typeof payload.summary === "string" ? payload.summary.trim() : "",
    extractedText,
    ocrConfidence,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ocrText, ocrConfidence } = await req.json();

    if (typeof ocrText !== "string" || !ocrText.trim()) {
      return new Response(
        JSON.stringify({ error: "ocrText is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemPrompt = `You analyze OCR text extracted from the back side of medicine packaging.

Return ONLY valid JSON with these exact keys:
- medicineName: string | null
- manufacturer: string | null
- uses: string[]
- conditionsTreated: string[]
- activeIngredients: string[]
- drugClass: string | null
- commonSideEffects: string[]
- importantPrecautions: string[]
- confidence: "low" | "medium" | "high"
- summary: string

Rules:
- Use only the OCR text provided. Do not invent details if the OCR text is unclear.
- If a field is uncertain, set it to null or [] and lower the confidence.
- Keep summary under 80 words.
- Do not wrap the JSON in markdown or add commentary.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [
            {
              parts: [
                {
                  text: `Extract structured medicine information from this OCR text:\n\n${ocrText}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 700,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const responseText = await response.text();
      console.error("Gemini API error:", response.status, responseText);

      return new Response(
        JSON.stringify({ error: "Gemini analysis failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Gemini returned an empty response");
    }

    const parsed = parseJsonObject(content);
    const normalized = normalizeResponse(parsed, ocrText.trim(), Number(ocrConfidence) || 0);

    return new Response(JSON.stringify(normalized), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("medicine-scanner error:", error);

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
