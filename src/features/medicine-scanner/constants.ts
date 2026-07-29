export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024;

export const OCR_PSM_MODES = [6, 11] as const;

export const MIN_MEANINGFUL_OCR_LENGTH = 20;

export const MEDICINE_TEXT_HINTS = [
  "tablet",
  "capsule",
  "composition",
  "dosage",
  "manufacturer",
  "marketed by",
  "batch",
  "expiry",
  "mg",
] as const;
