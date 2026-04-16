import { z } from "zod";

const maxInlineImageUrlLength = 2_500_000;

function isInlineImageDataUrl(value: string) {
  return /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/iu.test(value.trim());
}

export const optionalImageUrlSchema = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim().length === 0) {
      return null;
    }

    return value;
  },
  z
    .string()
    .trim()
    .max(maxInlineImageUrlLength)
    .refine((value) => isAbsoluteHttpUrl(value) || isInlineImageDataUrl(value), {
      message: "Expected an absolute image URL or inline image data URL.",
    })
    .nullable()
    .optional(),
);

export function normalizeOptionalImageUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed?.length ? trimmed : null;
}

export function isAbsoluteHttpUrl(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return false;
  }

  if (isInlineImageDataUrl(trimmed)) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
