import { supabase } from "@/integrations/supabase/client";
import type { AnalyzeMedicinePayload, MedicineAnalysisResult } from "@/features/medicine-scanner/types";

// ===============================
// TEMPORARY INTERVIEW DEMO MODE
// Disable DEMO_MODE to restore
// Gemini + Supabase workflow.
// ===============================
export const DEMO_MODE = true;

const DEMO_DELAY_MS = 2400;

type DemoMedicineKey = "paracip-500" | "aspirin" | "zindervit-nf";

interface DemoMedicineDefinition {
  key: DemoMedicineKey;
  matchTerms: readonly string[];
  result: Omit<MedicineAnalysisResult, "extractedText" | "ocrConfidence">;
}

const DEMO_MEDICINES: readonly DemoMedicineDefinition[] = [
  {
    key: "paracip-500",
    matchTerms: [
      "PARACIP",
      "PARACIP-500",
      "PARACIP500",
      "PARACIP 500",
      "PARACLP",
      "PARACIP S00",
      "PARACETAMOL",
      "PARACETAMOI",
      "CIPLA",
      "CIPIA",
    ],
    result: {
      medicineName: "PARACIP-500",
      manufacturer: "Cipla",
      uses: [
        "Reduces fever",
        "Relieves headache",
        "Relieves toothache",
        "Relieves muscle pain",
        "Relieves body pain",
        "Mild to moderate pain relief",
      ],
      conditionsTreated: [
        "Fever",
        "Headache",
        "Toothache",
        "Muscle pain",
        "General body pain",
      ],
      activeIngredients: ["Paracetamol IP 500 mg"],
      drugClass: "Analgesic, Antipyretic",
      commonSideEffects: [
        "Nausea",
        "Vomiting",
        "Mild allergic rash",
        "Rare liver damage in overdose",
      ],
      importantPrecautions: [
        "Do not exceed recommended dosage.",
        "Avoid alcohol while taking this medicine.",
        "Consult a doctor if symptoms persist.",
      ],
      confidence: "high",
      summary: "PARACIP-500 is a paracetamol medicine used for fever reduction and mild to moderate pain relief.",
    },
  },
  {
    key: "aspirin",
    matchTerms: [
      "ASPIRIN",
      "ASPIRN",
      "ASPIR",
      "BAYER",
      "0.5",
    ],
    result: {
      medicineName: "Aspirin",
      manufacturer: "Bayer",
      uses: [
        "Pain relief",
        "Reduces fever",
        "Reduces inflammation",
        "Helps prevent blood clots",
        "Helps reduce risk of heart attack and stroke (under medical supervision)",
      ],
      conditionsTreated: [
        "Pain",
        "Fever",
        "Inflammation",
        "Blood clot prevention",
      ],
      activeIngredients: ["Acetylsalicylic Acid (Aspirin)"],
      drugClass: "NSAID, Antiplatelet Agent",
      commonSideEffects: [
        "Stomach irritation",
        "Heartburn",
        "Nausea",
        "Increased bleeding risk",
      ],
      importantPrecautions: [
        "Avoid if allergic to aspirin.",
        "Do not use in children with viral illness unless advised by a doctor.",
        "Take after food when possible.",
        "Consult a doctor before regular use.",
      ],
      confidence: "high",
      summary: "Aspirin is used for pain, fever, inflammation, and in some cases blood clot prevention under medical guidance.",
    },
  },
  {
    key: "zindervit-nf",
    matchTerms: [
      "ZINDERVIT",
      "ZINDERVIT NF",
      "ZINDERVITNF",
      "ZINDER",
      "PREVEGO",
      "MULTIVITAMIN",
      "MULTIMINERAL",
    ],
    result: {
      medicineName: "ZINDERVIT NF",
      manufacturer: "Prevego Healthcare",
      uses: [
        "Prevents vitamin deficiencies",
        "Supports immunity",
        "Improves overall health",
        "Helps reduce weakness and fatigue",
        "Supports recovery from illness",
      ],
      conditionsTreated: [
        "Vitamin deficiency",
        "Weakness and fatigue",
        "Recovery support",
      ],
      activeIngredients: ["Multivitamins & Multiminerals"],
      drugClass: "Nutritional Supplement",
      commonSideEffects: [
        "Mild stomach discomfort",
        "Nausea",
        "Constipation (rare)",
      ],
      importantPrecautions: [
        "Take after meals.",
        "Do not exceed the recommended dose.",
        "Store in a cool, dry place.",
        "Consult a doctor if pregnant or taking other medications.",
      ],
      confidence: "high",
      summary: "ZINDERVIT NF is a multivitamin and multimineral nutritional supplement used to support recovery and overall health.",
    },
  },
] as const;

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs));
}

function normalizeForDemoMatch(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/[1L]/g, "I")
    .replace(/5/g, "S")
    .replace(/0/g, "O");
}

function levenshteinDistance(left: string, right: string): number {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let col = 0; col < cols; col += 1) matrix[0][col] = col;

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}

function similarityScore(left: string, right: string): number {
  if (!left || !right) return 0;
  return 1 - levenshteinDistance(left, right) / Math.max(left.length, right.length);
}

function extractCandidates(ocrText: string): string[] {
  const normalizedText = normalizeForDemoMatch(ocrText);
  const tokens = ocrText
    .toUpperCase()
    .split(/[^A-Z0-9.]+/)
    .map((token) => normalizeForDemoMatch(token))
    .filter(Boolean);
  const candidates = new Set<string>([normalizedText, ...tokens]);

  for (let index = 0; index < tokens.length; index += 1) {
    const twoWord = `${tokens[index]}${tokens[index + 1] ?? ""}`;
    const threeWord = `${tokens[index]}${tokens[index + 1] ?? ""}${tokens[index + 2] ?? ""}`;
    if (twoWord) candidates.add(twoWord);
    if (threeWord) candidates.add(threeWord);
  }

  return [...candidates];
}

function getBestDemoMatch(ocrText: string): DemoMedicineDefinition | null {
  const candidates = extractCandidates(ocrText);
  let bestMatch: DemoMedicineDefinition | null = null;
  let bestScore = 0;

  for (const medicine of DEMO_MEDICINES) {
    for (const rawTarget of medicine.matchTerms) {
      const target = normalizeForDemoMatch(rawTarget);

      for (const candidate of candidates) {
        let score = 0;

        if (candidate.includes(target) || target.includes(candidate)) {
          if (candidate.length >= 4) {
            score = Math.min(candidate.length, target.length) / Math.max(candidate.length, target.length);
          }
        } else {
          const closeEnoughLength = Math.abs(candidate.length - target.length) <= 4;
          if (closeEnoughLength) {
            score = similarityScore(candidate, target);
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = medicine;
        }
      }
    }
  }

  return bestScore >= 0.74 ? bestMatch : null;
}

function buildDemoResult(
  definition: DemoMedicineDefinition,
  payload: AnalyzeMedicinePayload,
): MedicineAnalysisResult {
  return {
    ...definition.result,
    extractedText: payload.ocrText,
    ocrConfidence: payload.ocrConfidence,
  };
}

export async function analyzeMedicineText(payload: AnalyzeMedicinePayload): Promise<MedicineAnalysisResult> {
  if (DEMO_MODE) {
    await delay(DEMO_DELAY_MS);

    const match = getBestDemoMatch(payload.ocrText);
    if (!match) {
      throw new Error("Medicine not recognized. Demo currently supports PARACIP-500, Aspirin and ZINDERVIT NF.");
    }

    return buildDemoResult(match, payload);
  }

  const { data, error } = await supabase.functions.invoke("medicine-scanner", {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || "Failed to analyze medicine information");
  }

  return data as MedicineAnalysisResult;
}
