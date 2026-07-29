import type { ImagePreprocessResult } from "@/features/medicine-scanner/types";

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function loadImageBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to HTMLImageElement.
    }
  }

  const src = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Failed to load image"));
      element.src = src;
    });
    return image;
  } finally {
    URL.revokeObjectURL(src);
  }
}

function drawScaledImage(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): HTMLCanvasElement {
  const maxDimension = 2200;
  const scale = Math.max(1, Math.min(maxDimension / sourceWidth, maxDimension / sourceHeight));
  const targetWidth = Math.round(sourceWidth * scale);
  const targetHeight = Math.round(sourceHeight * scale);
  const canvas = createCanvas(targetWidth, targetHeight);
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Unable to initialize image processing");
  }

  context.drawImage(source, 0, 0, targetWidth, targetHeight);
  return canvas;
}

function grayscaleAndContrast(data: Uint8ClampedArray, contrastBoost: number): Uint8ClampedArray {
  const adjusted = new Uint8ClampedArray(data.length);

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const contrasted = clampChannel((gray - 128) * contrastBoost + 128);
    adjusted[index] = contrasted;
    adjusted[index + 1] = contrasted;
    adjusted[index + 2] = contrasted;
    adjusted[index + 3] = data[index + 3];
  }

  return adjusted;
}

function applyThreshold(data: Uint8ClampedArray, threshold: number): Uint8ClampedArray {
  const thresholded = new Uint8ClampedArray(data.length);

  for (let index = 0; index < data.length; index += 4) {
    const value = data[index] > threshold ? 255 : 0;
    thresholded[index] = value;
    thresholded[index + 1] = value;
    thresholded[index + 2] = value;
    thresholded[index + 3] = data[index + 3];
  }

  return thresholded;
}

function applyMedianDenoise(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data);
  const pixel = (x: number, y: number) => (y * width + x) * 4;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const neighborhood: number[] = [];
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          neighborhood.push(data[pixel(x + offsetX, y + offsetY)]);
        }
      }
      neighborhood.sort((left, right) => left - right);
      const median = neighborhood[4];
      const index = pixel(x, y);
      output[index] = median;
      output[index + 1] = median;
      output[index + 2] = median;
    }
  }

  return output;
}

function applySharpen(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0,
  ];
  const pixel = (x: number, y: number) => (y * width + x) * 4;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let sum = 0;
      let kernelIndex = 0;
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          sum += data[pixel(x + offsetX, y + offsetY)] * kernel[kernelIndex];
          kernelIndex += 1;
        }
      }

      const value = clampChannel(sum);
      const index = pixel(x, y);
      output[index] = value;
      output[index + 1] = value;
      output[index + 2] = value;
      output[index + 3] = data[index + 3];
    }
  }

  return output;
}

function writeImageData(canvas: HTMLCanvasElement, pixels: Uint8ClampedArray): string {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Unable to finalize image processing");
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  imageData.data.set(pixels);
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export async function preprocessMedicineImage(file: File): Promise<ImagePreprocessResult> {
  const source = await loadImageBitmap(file);
  const sourceWidth = "width" in source ? source.width : source.naturalWidth;
  const sourceHeight = "height" in source ? source.height : source.naturalHeight;
  const canvas = drawScaledImage(source, sourceWidth, sourceHeight);
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Unable to process image");
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const grayscale = grayscaleAndContrast(imageData.data, 1.45);
  const denoised = applyMedianDenoise(grayscale, canvas.width, canvas.height);
  const sharpened = applySharpen(denoised, canvas.width, canvas.height);
  const thresholded = applyThreshold(sharpened, 165);
  const aggressiveThreshold = applyThreshold(sharpened, 140);

  const variants = [
    { name: "grayscale", dataUrl: writeImageData(createCanvas(canvas.width, canvas.height), grayscale) },
    { name: "thresholded", dataUrl: writeImageData(createCanvas(canvas.width, canvas.height), thresholded) },
    { name: "high-contrast", dataUrl: writeImageData(createCanvas(canvas.width, canvas.height), aggressiveThreshold) },
  ];

  return {
    variants,
    width: canvas.width,
    height: canvas.height,
  };
}
