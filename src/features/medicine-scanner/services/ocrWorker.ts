import type { PSM, Worker } from "tesseract.js";

let workerPromise: Promise<Worker> | null = null;

async function loadTesseract() {
  return import("tesseract.js");
}

async function resolvePsm(psm: number): Promise<PSM> {
  const { PSM } = await loadTesseract();
  return psm === 11 ? PSM.SPARSE_TEXT : PSM.SINGLE_BLOCK;
}

export async function getOcrWorker(logger?: (progress: number, status: string) => void): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await loadTesseract();
      return createWorker("eng", 1, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            logger?.(message.progress, "Recognizing text");
          } else if (message.status === "loading language traineddata") {
            logger?.(message.progress * 0.4, "Loading OCR language data");
          }
        },
      });
    })();
  }

  const worker = await workerPromise;
  return worker;
}

export async function recognizeText(
  image: string,
  psm: number,
  logger?: (progress: number, status: string) => void,
): Promise<{ text: string; confidence: number }> {
  const worker = await getOcrWorker(logger);
  await worker.setParameters({
    tessedit_pageseg_mode: await resolvePsm(psm),
    tessedit_ocr_engine_mode: "1",
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
  });

  const result = await worker.recognize(image);
  return {
    text: result.data.text ?? "",
    confidence: result.data.confidence ?? 0,
  };
}
