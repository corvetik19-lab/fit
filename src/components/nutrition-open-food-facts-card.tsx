"use client";

import Image from "next/image";
import { Camera, Check, Search, ScanBarcode, Sparkles } from "lucide-react";
import { useState } from "react";

import { NutritionBarcodeScanner } from "@/components/nutrition-barcode-scanner";
import type { NutritionFood } from "@/lib/nutrition/meal-logging";

const inputClassName =
  "w-full rounded-[0.95rem] border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10";

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
        { method: "GET" },
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
      className="surface-panel surface-panel--soft p-3.5 sm:p-4"
      data-testid={`nutrition-open-food-facts-card-${mode}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="workspace-kicker">Open Food Facts</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            Штрихкод и быстрый импорт
          </h3>
          <p className="mt-1 text-sm leading-5 text-muted">
            Найдём продукт, состав, КБЖУ и фото упаковки без ручного ввода.
          </p>
        </div>

        <button
          className="action-button action-button--secondary shrink-0 px-3 py-2 text-xs"
          onClick={() => setIsScannerOpen((current) => !current)}
          type="button"
        >
          <ScanBarcode size={15} strokeWidth={2.2} />
          {isScannerOpen ? "Скрыть" : "Сканер"}
        </button>
      </div>

      {isScannerOpen ? (
        <div className="mt-3">
          <NutritionBarcodeScanner
            onClose={() => setIsScannerOpen(false)}
            onDetected={handleScannerDetected}
          />
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
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
          Камера
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {lookupResult ? (
        <article
          className="surface-panel mt-3 p-3.5 sm:p-4"
          data-testid={`nutrition-open-food-facts-preview-${mode}`}
        >
          <div className="grid gap-3 sm:grid-cols-[112px_1fr]">
            <div className="overflow-hidden rounded-[1.15rem] border border-border bg-white">
              {lookupResult.product.imageUrl ? (
                <Image
                  alt={lookupResult.product.name}
                  className="h-[112px] w-full object-cover"
                  height={112}
                  src={lookupResult.product.imageUrl}
                  unoptimized
                  width={112}
                />
              ) : (
                <div className="flex h-[112px] items-center justify-center bg-[color:var(--accent-soft)] text-sm font-medium text-accent">
                  Нет фото
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-base font-semibold text-foreground">
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
                <span className="pill">#{lookupResult.product.barcode}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Metric label="Ккал / 100 г" value={lookupResult.product.kcal === null ? "нет" : `${Math.round(lookupResult.product.kcal)} ккал`} />
                <Metric label="Белки" value={formatMacro(lookupResult.product.protein)} />
                <Metric label="Жиры" value={formatMacro(lookupResult.product.fat)} />
                <Metric label="Углеводы" value={formatMacro(lookupResult.product.carbs)} />
              </div>
            </div>
          </div>

          <div className="surface-panel surface-panel--accent mt-3 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-accent" size={16} strokeWidth={2.2} />
              <p className="text-sm font-semibold text-foreground">Состав</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              {lookupResult.product.ingredientsText ??
                "В Open Food Facts нет текстового состава для этого продукта."}
            </p>
            <a
              className="mt-2 inline-flex text-sm font-medium text-accent transition hover:opacity-80"
              href={lookupResult.product.productUrl}
              rel="noreferrer"
              target="_blank"
            >
              Открыть карточку в Open Food Facts
            </a>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {lookupResult.existingFood ? (
              <>
                <button
                  className="action-button border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                  data-testid={`nutrition-open-food-facts-use-existing-${mode}`}
                  onClick={() =>
                    onResolveFood(lookupResult.existingFood as NutritionFood, "existing")
                  }
                  type="button"
                >
                  <Check size={16} strokeWidth={2.2} />
                  {localActionLabel}
                </button>
                <span className="pill">Уже есть в базе</span>
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
        </article>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-tile p-2.5">
      <p className="workspace-kicker">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
