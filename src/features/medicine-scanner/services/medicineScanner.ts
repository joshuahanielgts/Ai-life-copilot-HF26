import { supabase } from "@/integrations/supabase/client";
import type { AnalyzeMedicinePayload, MedicineAnalysisResult } from "@/features/medicine-scanner/types";

export async function analyzeMedicineText(payload: AnalyzeMedicinePayload): Promise<MedicineAnalysisResult> {
  const { data, error } = await supabase.functions.invoke("medicine-scanner", {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || "Failed to analyze medicine information");
  }

  return data as MedicineAnalysisResult;
}
