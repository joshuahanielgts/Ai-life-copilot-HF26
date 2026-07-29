export interface OcrVariantResult {
  variant: string;
  psm: number;
  text: string;
  confidence: number;
}

export interface OcrProgressState {
  phase: "idle" | "preprocessing" | "ocr" | "analyzing" | "complete" | "error";
  progress: number;
  message: string;
}

export interface MedicineAnalysisResult {
  medicineName: string | null;
  manufacturer: string | null;
  uses: string[];
  conditionsTreated: string[];
  activeIngredients: string[];
  drugClass: string | null;
  commonSideEffects: string[];
  importantPrecautions: string[];
  confidence: "low" | "medium" | "high";
  summary: string;
  extractedText: string;
  ocrConfidence: number;
}

export interface AnalyzeMedicinePayload {
  ocrText: string;
  ocrConfidence: number;
}

export interface ImagePreprocessResult {
  variants: Array<{
    name: string;
    dataUrl: string;
  }>;
  width: number;
  height: number;
}
