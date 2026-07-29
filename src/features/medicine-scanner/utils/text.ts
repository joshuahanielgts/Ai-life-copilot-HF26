import { MEDICINE_TEXT_HINTS } from "@/features/medicine-scanner/constants";
import type { OcrVariantResult } from "@/features/medicine-scanner/types";

export function normalizeOcrText(text: string): string {
  return text
    .replace(/[|]/g, "I")
    .replace(/[•·]/g, ".")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function scoreMedicineText(text: string): number {
  const normalized = text.toLowerCase();
  if (!normalized) return 0;

  const hintScore = MEDICINE_TEXT_HINTS.reduce((score, hint) => {
    return score + (normalized.includes(hint) ? 12 : 0);
  }, 0);

  const alphanumericScore = Math.min(20, (normalized.match(/[a-z0-9]/g)?.length ?? 0) / 8);
  const lineScore = Math.min(15, normalized.split("\n").filter(Boolean).length * 2);

  return hintScore + alphanumericScore + lineScore;
}

export function pickBestOcrResult(results: OcrVariantResult[]): OcrVariantResult | null {
  if (results.length === 0) return null;

  return [...results].sort((left, right) => {
    const leftScore = left.confidence * 0.75 + scoreMedicineText(left.text);
    const rightScore = right.confidence * 0.75 + scoreMedicineText(right.text);
    return rightScore - leftScore;
  })[0];
}

export function isLikelyMedicineText(text: string): boolean {
  return scoreMedicineText(text) >= 20;
}
