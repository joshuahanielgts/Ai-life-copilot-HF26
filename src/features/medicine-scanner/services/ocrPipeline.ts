import { OCR_PSM_MODES, MIN_MEANINGFUL_OCR_LENGTH } from "@/features/medicine-scanner/constants";
import { preprocessMedicineImage } from "@/features/medicine-scanner/utils/image";
import { normalizeOcrText, pickBestOcrResult } from "@/features/medicine-scanner/utils/text";
import { recognizeText } from "@/features/medicine-scanner/services/ocrWorker";
import type { OcrProgressState, OcrVariantResult } from "@/features/medicine-scanner/types";

export async function runMedicineOcr(
  file: File,
  onProgress: (state: OcrProgressState) => void,
): Promise<{ text: string; confidence: number; variants: OcrVariantResult[]; preview: string }> {
  onProgress({ phase: "preprocessing", progress: 0.05, message: "Preparing image for OCR" });
  const prepared = await preprocessMedicineImage(file);
  const preview = prepared.variants[1]?.dataUrl ?? prepared.variants[0]?.dataUrl ?? "";
  const totalRuns = prepared.variants.length * OCR_PSM_MODES.length;
  let completedRuns = 0;
  const results: OcrVariantResult[] = [];

  for (const variant of prepared.variants) {
    for (const psm of OCR_PSM_MODES) {
      const baseProgress = completedRuns / totalRuns;
      const response = await recognizeText(variant.dataUrl, psm, (ocrProgress, status) => {
        onProgress({
          phase: "ocr",
          progress: 0.2 + (baseProgress + ocrProgress / totalRuns) * 0.65,
          message: `${status} (${variant.name}, PSM ${psm})`,
        });
      });

      results.push({
        variant: variant.name,
        psm,
        text: normalizeOcrText(response.text),
        confidence: response.confidence,
      });
      completedRuns += 1;
    }
  }

  const best = pickBestOcrResult(results);
  if (!best || best.text.length < MIN_MEANINGFUL_OCR_LENGTH) {
    throw new Error("The image did not contain enough readable text. Try a sharper photo of the medicine box or strip back side.");
  }

  onProgress({ phase: "complete", progress: 0.9, message: "OCR complete" });
  return {
    text: best.text,
    confidence: best.confidence,
    variants: results,
    preview,
  };
}
