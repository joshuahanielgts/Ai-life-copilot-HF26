import { useEffect, useState } from "react";
import { MAX_FILE_SIZE_BYTES, SUPPORTED_IMAGE_TYPES } from "@/features/medicine-scanner/constants";
import { runMedicineOcr } from "@/features/medicine-scanner/services/ocrPipeline";
import { analyzeMedicineText } from "@/features/medicine-scanner/services/medicineScanner";
import { isLikelyMedicineText } from "@/features/medicine-scanner/utils/text";
import type { MedicineAnalysisResult, OcrProgressState } from "@/features/medicine-scanner/types";

const defaultProgressState: OcrProgressState = {
  phase: "idle",
  progress: 0,
  message: "Ready to scan",
};

export function useMedicineScanner() {
  const [result, setResult] = useState<MedicineAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<OcrProgressState>(defaultProgressState);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);

  useEffect(() => {
    return () => {
      if (sourcePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(sourcePreview);
      }
    };
  }, [sourcePreview]);

  const reset = () => {
    if (sourcePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(sourcePreview);
    }
    setResult(null);
    setError(null);
    setProgress(defaultProgressState);
    setSourcePreview(null);
    setProcessedPreview(null);
    setOcrText("");
    setIsBusy(false);
    setLastFile(null);
  };

  const validateFile = (file: File) => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
      throw new Error("Unsupported image format. Use JPG, PNG, WebP, or HEIC.");
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error("Image is too large. Use a file smaller than 12 MB.");
    }
  };

  const analyzeFile = async (file: File) => {
    validateFile(file);
    setIsBusy(true);
    setError(null);
    setResult(null);
    setLastFile(file);

    if (sourcePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(sourcePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setSourcePreview(previewUrl);

    try {
      const ocrOutput = await runMedicineOcr(file, setProgress);
      setProcessedPreview(ocrOutput.preview);
      setOcrText(ocrOutput.text);

      if (!isLikelyMedicineText(ocrOutput.text)) {
        throw new Error("No medicine packaging text was detected. Capture the back side of the strip or box in better lighting.");
      }

      setProgress({
        phase: "analyzing",
        progress: 0.94,
        message: "Analyzing OCR text with Gemini",
      });

      const analysis = await analyzeMedicineText({
        ocrText: ocrOutput.text,
        ocrConfidence: ocrOutput.confidence,
      });

      setResult(analysis);
      setProgress({
        phase: "complete",
        progress: 1,
        message: "Scan complete",
      });
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Failed to scan medicine");
      setProgress({
        phase: "error",
        progress: 0,
        message: "Scan failed",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const retry = async () => {
    if (lastFile) {
      await analyzeFile(lastFile);
    }
  };

  return {
    analyzeFile,
    error,
    isBusy,
    ocrText,
    processedPreview,
    progress,
    reset,
    result,
    retry,
    sourcePreview,
  };
}
