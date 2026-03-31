const OPEN_FOOD_FACTS_BASE_URL = "https://world.openfoodfacts.org";
const OPEN_FOOD_FACTS_FIELDS = [
  "code",
  "product_name",
  "brands",
  "image_front_url",
  "image_url",
  "ingredients_text",
  "quantity",
  "serving_size",
  "nutriments",
].join(",");

export const openFoodFactsBarcodePattern = /^[0-9]{6,32}$/u;

type OpenFoodFactsProductPayload = {
  brands?: string | null;
  code?: string | null;
  image_front_url?: string | null;
  image_url?: string | null;
  ingredients_text?: string | null;
  nutriments?: Record<string, unknown> | null;
  product_name?: string | null;
  quantity?: string | null;
  serving_size?: string | null;
};

type OpenFoodFactsLookupResponse = {
  code?: string | null;
  product?: OpenFoodFactsProductPayload | null;
  status?: number;
  status_verbose?: string | null;
};

export type OpenFoodFactsProduct = {
  barcode: string;
  brand: string | null;
  carbs: number | null;
  fat: number | null;
  imageUrl: string | null;
  ingredientsText: string | null;
  kcal: number | null;
  name: string;
  productUrl: string;
  protein: number | null;
  quantity: string | null;
  servingSize: string | null;
};

function normalizeBarcode(value: string) {
  return value.replace(/\s+/gu, "").trim();
}

function toNullableTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim().length ? value.trim() : null;
}

function toNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length) {
    const normalized = Number(value.replace(",", "."));
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

function readMacro(
  nutriments: Record<string, unknown> | null | undefined,
  key: string,
) {
  if (!nutriments) {
    return null;
  }

  return (
    toNullableNumber(nutriments[`${key}_100g`]) ??
    toNullableNumber(nutriments[key]) ??
    null
  );
}

function readKcal(nutriments: Record<string, unknown> | null | undefined) {
  if (!nutriments) {
    return null;
  }

  return (
    toNullableNumber(nutriments["energy-kcal_100g"]) ??
    toNullableNumber(nutriments["energy-kcal"]) ??
    null
  );
}

export function parseOpenFoodFactsBarcode(value: string) {
  const normalized = normalizeBarcode(value);

  if (!openFoodFactsBarcodePattern.test(normalized)) {
    return null;
  }

  return normalized;
}

export function normalizeOpenFoodFactsProduct(
  barcode: string,
  product: OpenFoodFactsProductPayload,
) {
  const normalizedBarcode = parseOpenFoodFactsBarcode(barcode);

  if (!normalizedBarcode) {
    return null;
  }

  const name = toNullableTrimmedString(product.product_name);

  if (!name) {
    return null;
  }

  return {
    barcode: normalizedBarcode,
    brand: toNullableTrimmedString(product.brands),
    carbs: readMacro(product.nutriments, "carbohydrates"),
    fat: readMacro(product.nutriments, "fat"),
    imageUrl:
      toNullableTrimmedString(product.image_front_url) ??
      toNullableTrimmedString(product.image_url),
    ingredientsText: toNullableTrimmedString(product.ingredients_text),
    kcal: readKcal(product.nutriments),
    name,
    productUrl: `${OPEN_FOOD_FACTS_BASE_URL}/product/${normalizedBarcode}`,
    protein: readMacro(product.nutriments, "proteins"),
    quantity: toNullableTrimmedString(product.quantity),
    servingSize: toNullableTrimmedString(product.serving_size),
  } satisfies OpenFoodFactsProduct;
}

export async function lookupOpenFoodFactsProduct(barcode: string) {
  const normalizedBarcode = parseOpenFoodFactsBarcode(barcode);

  if (!normalizedBarcode) {
    return null;
  }

  const response = await fetch(
    `${OPEN_FOOD_FACTS_BASE_URL}/api/v2/product/${normalizedBarcode}?fields=${OPEN_FOOD_FACTS_FIELDS}`,
    {
      cache: "no-store",
      headers: {
        "User-Agent": "fit-platform/1.0 (nutrition barcode lookup)",
      },
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    throw new Error(`OPEN_FOOD_FACTS_HTTP_${response.status}`);
  }

  const payload = (await response.json()) as OpenFoodFactsLookupResponse;

  if (payload.status !== 1 || !payload.product) {
    return null;
  }

  return normalizeOpenFoodFactsProduct(normalizedBarcode, payload.product);
}
