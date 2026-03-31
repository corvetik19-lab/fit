"use client";

import Image from "next/image";
import { Camera, Check, Search, ScanBarcode, Sparkles } from "lucide-react";
import { useState } from "react";

import { NutritionBarcodeScanner } from "@/components/nutrition-barcode-scanner";
import type { NutritionFood } from "@/lib/nutrition/meal-logging";

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

type LookupPreview = {
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

type LookupResult = {
  existingFood: NutritionFood | null;
  product: LookupPreview;
};

function formatMacro(value: number | null, suffix = "г") {
  if (value === null) {
    return "нет данных";
  }

  return `${value.toLocaleString("ru-RU", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  })} ${suffix}`;
}

export function NutritionOpenFoodFactsCard({
  mode,
  onResolveFood,
}: {
  mode: "foods" | "meal";
  onResolveFood: (food: NutritionFood, origin: "existing" | "imported") => void;
}) {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);

  async function lookupBarcode(nextBarcode?: string) {
    const normalizedBarcode = (nextBarcode ?? barcode).trim();

    if (!normalizedBarcode) {
      setError("Введи штрихкод или открой сканер упаковки.");
      setLookupResult(null);
      return;
    }

    setIsLookingUp(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/foods/open-food-facts/${encodeURIComponent(normalizedBarcode)}`,
        {
          method: "GET",
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { data?: LookupResult; message?: string }
        | null;

      if (!response.ok || !payload?.data) {
        setLookupResult(null);
        setError(payload?.message ?? "Не удалось найти продукт по штрихкоду.");
        return;
      }

      setBarcode(payload.data.product.barcode);
      setLookupResult(payload.data);
      setError(null);
    } finally {
      setIsLookingUp(false);
    }
  }

  async function importFood() {
    if (!lookupResult) {
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/foods/open-food-facts/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          barcode: lookupResult.product.barcode,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { data?: NutritionFood; message?: string }
        | null;

      if (!response.ok || !payload?.data) {
        setError(payload?.message ?? "Не удалось импортировать продукт.");
        return;
      }

      onResolveFood(payload.data, "imported");
      setLookupResult((current) =>
        current
          ? {
              ...current,
              existingFood: payload.data ?? null,
            }
          : current,
      );
      setError(null);
    } finally {
      setIsImporting(false);
    }
  }

  function handleScannerDetected(nextBarcode: string) {
    setBarcode(nextBarcode);
    setIsScannerOpen(false);
    void lookupBarcode(nextBarcode);
  }

  const primaryActionLabel =
    mode === "meal" ? "Импортировать и добавить" : "Импортировать в базу";
  const localActionLabel =
    mode === "meal" ? "Добавить в текущий приём" : "Открыть в базе";

  return (
    <section
      className="surface-panel surface-panel--soft p-5"
      data-testid={`nutrition-open-food-facts-card-${mode}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="workspace-kicker">
            Open Food Facts
          </p>
          <h3 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
            Сканер упаковки и быстрый импорт
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Найдём продукт по штрихкоду, покажем состав и картинку, а потом
            сохраним его в твою базу без ручного набора КБЖУ.
          </p>
        </div>

        <button
          className="action-button action-button--secondary px-4 py-2.5 text-sm"
          onClick={() => setIsScannerOpen((current) => !current)}
          type="button"
        >
          <ScanBarcode size={16} strokeWidth={2.2} />
          {isScannerOpen ? "Скрыть сканер" : "Открыть сканер"}
        </button>
      </div>

      {isScannerOpen ? (
        <div className="mt-5">
          <NutritionBarcodeScanner
            onClose={() => setIsScannerOpen(false)}
            onDetected={handleScannerDetected}
          />
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <input
          className={inputClassName}
          inputMode="numeric"
          onChange={(event) => setBarcode(event.target.value)}
          placeholder="Например, 4601234567890"
          type="text"
          value={barcode}
        />
        <button
          className="action-button action-button--secondary"
          disabled={isLookingUp}
          onClick={() => void lookupBarcode()}
          type="button"
        >
          <Search size={16} strokeWidth={2.2} />
          {isLookingUp ? "Ищу..." : "Найти"}
        </button>
        <button
          className="action-button action-button--soft"
          onClick={() => setIsScannerOpen(true)}
          type="button"
        >
          <Camera size={16} strokeWidth={2.2} />
          Снять упаковку
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {lookupResult ? (
        <article
          className="surface-panel mt-5 p-4 sm:p-5"
          data-testid={`nutrition-open-food-facts-preview-${mode}`}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,168px)_1fr]">
            <div className="overflow-hidden rounded-[1.5rem] border border-border bg-white/78">
              {lookupResult.product.imageUrl ? (
                <Image
                  alt={lookupResult.product.name}
                  className="h-full w-full object-cover"
                  height={168}
                  src={lookupResult.product.imageUrl}
                  unoptimized
                  width={168}
                />
              ) : (
                <div className="flex h-[168px] items-center justify-center bg-[color-mix(in_srgb,var(--accent-soft)_50%,white)] text-sm font-medium text-accent">
                  Нет фото
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {lookupResult.product.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {lookupResult.product.brand ?? "Бренд не указан"}
                    {lookupResult.product.quantity
                      ? ` · ${lookupResult.product.quantity}`
                      : ""}
                    {lookupResult.product.servingSize
                      ? ` · порция ${lookupResult.product.servingSize}`
                      : ""}
                  </p>
                </div>
                <span className="pill">Штрихкод: {lookupResult.product.barcode}</span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="surface-panel surface-panel--soft p-3">
                  <p className="workspace-kicker">
                    Ккал / 100 г
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {lookupResult.product.kcal === null
                      ? "нет данных"
                      : `${Math.round(lookupResult.product.kcal)} ккал`}
                  </p>
                </div>
                <div className="surface-panel surface-panel--soft p-3">
                  <p className="workspace-kicker">
                    Белки
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {formatMacro(lookupResult.product.protein)}
                  </p>
                </div>
                <div className="surface-panel surface-panel--soft p-3">
                  <p className="workspace-kicker">
                    Жиры
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {formatMacro(lookupResult.product.fat)}
                  </p>
                </div>
                <div className="surface-panel surface-panel--soft p-3">
                  <p className="workspace-kicker">
                    Углеводы
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {formatMacro(lookupResult.product.carbs)}
                  </p>
                </div>
              </div>

              <div className="surface-panel surface-panel--accent mt-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Sparkles size={16} strokeWidth={2.2} className="text-accent" />
                  <p className="text-sm font-semibold text-foreground">Состав</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {lookupResult.product.ingredientsText ??
                    "В Open Food Facts нет текстового состава для этого продукта."}
                </p>
                <a
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-accent transition hover:opacity-80"
                  href={lookupResult.product.productUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Открыть карточку продукта в Open Food Facts
                </a>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {lookupResult.existingFood ? (
                  <>
                    <button
                      className="action-button border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                      onClick={() =>
                        onResolveFood(lookupResult.existingFood as NutritionFood, "existing")
                      }
                      type="button"
                    >
                      <Check size={16} strokeWidth={2.2} />
                      {localActionLabel}
                    </button>
                    <span className="inline-flex items-center rounded-full border border-border bg-white/80 px-4 py-3 text-sm text-muted">
                      Этот продукт уже есть в твоей базе.
                    </span>
                  </>
                ) : (
                  <button
                    className="action-button action-button--primary"
                    data-testid={`nutrition-open-food-facts-import-${mode}`}
                    disabled={isImporting}
                    onClick={() => void importFood()}
                    type="button"
                  >
                    {isImporting ? "Импортирую..." : primaryActionLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>
      ) : null}
    </section>
  );
}
