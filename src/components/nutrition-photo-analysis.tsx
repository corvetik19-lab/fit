"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, ImagePlus, LoaderCircle } from "lucide-react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { FeatureAccessSnapshot } from "@/lib/billing-access";

type MealPhotoAnalysis = {
  title: string;
  summary: string;
  confidence: "low" | "medium" | "high";
  estimatedKcal: number;
  macros: {
    protein: number;
    fat: number;
    carbs: number;
  };
  items: Array<{
    name: string;
    portion: string;
    confidence: "low" | "medium" | "high";
  }>;
  suggestions: string[];
};

type NutritionPhotoAnalysisProps = {
  access: FeatureAccessSnapshot;
};

const inputClassName =
  "w-full rounded-[0.95rem] border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-60";

function formatConfidence(value: MealPhotoAnalysis["confidence"]) {
  switch (value) {
    case "high":
      return "высокая";
    case "medium":
      return "средняя";
    case "low":
    default:
      return "низкая";
  }
}

function readSelectedFile(element: HTMLInputElement | null) {
  return element?.files?.[0] ?? null;
}

export function NutritionPhotoAnalysis({
  access,
}: NutritionPhotoAnalysisProps) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<MealPhotoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [activeImportMode, setActiveImportMode] = useState<"food" | "meal" | null>(
    null,
  );

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fileLabel = useMemo(() => {
    if (!file) {
      return "Фото ещё не выбрано";
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return `${file.name} · ${sizeMb} МБ`;
  }, [file]);

  function handleNextFile(nextFile: File | null) {
    setFile(nextFile);
    setResult(null);
    setError(null);
    setNotice(null);
  }

  function handleFileSelection(input: HTMLInputElement | null) {
    handleNextFile(readSelectedFile(input));
  }

  function runAnalysis() {
    if (!access.allowed) {
      setError(
        access.reason ??
          "AI-анализ фото сейчас недоступен для текущего плана.",
      );
      setResult(null);
      return;
    }

    if (!file) {
      setError("Сначала сними или выбери фото блюда.");
      setResult(null);
      return;
    }

    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("image", file);
        formData.set("notes", notes.trim());

        const response = await fetch("/api/ai/meal-photo", {
          body: formData,
          method: "POST",
        });

        const payload = (await response.json().catch(() => null)) as
          | { data?: MealPhotoAnalysis; message?: string }
          | null;

        if (!response.ok || !payload?.data) {
          setResult(null);
          setError(
            payload?.message ??
              "Не удалось проанализировать фото блюда. Попробуй более чёткий кадр или другой ракурс.",
          );
          return;
        }

        setResult(payload.data);
      } finally {
        setIsPending(false);
      }
    });
  }

  function importResult(mode: "food" | "meal") {
    if (!file || !result) {
      setError("Сначала получи AI-разбор фото, потом сохраняй его в питание.");
      return;
    }

    setActiveImportMode(mode);
    setError(null);
    setNotice(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("image", file);
        formData.set("analysis", JSON.stringify(result));
        formData.set("mode", mode);

        if (notes.trim()) {
          formData.set("notes", notes.trim());
        }

        const response = await fetch("/api/nutrition/photo-import", {
          body: formData,
          method: "POST",
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              data?: {
                food?: { id: string; name: string };
              };
              message?: string;
              meta?: {
                addedToMeal?: boolean;
                imageStored?: boolean;
              };
            }
          | null;

        if (!response.ok || !payload?.data?.food) {
          setError(
            payload?.message ??
              "Не удалось сохранить результат фотоанализа в питание.",
          );
          return;
        }

        const baseNotice =
          mode === "meal"
            ? `Продукт «${payload.data.food.name}» сохранён и сразу добавлен в дневник питания.`
            : `Продукт «${payload.data.food.name}» сохранён в твою базу продуктов.`;

        setNotice(
          payload.meta?.imageStored === false
            ? `${baseNotice} Изображение не удалось сохранить в storage, но запись уже создана.`
            : baseNotice,
        );

        router.refresh();
      } finally {
        setActiveImportMode(null);
      }
    });
  }

  return (
    <section className="surface-panel p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="workspace-kicker">Фото еды</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Сними блюдо и загрузи в питание
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted">
            AI оценит состав, а результат можно сохранить как продукт или сразу добавить в дневник.
          </p>
          {!access.allowed ? (
            <Link
              className="action-button action-button--secondary mt-3 px-4 py-2.5 text-sm"
              href="/settings#billing-center"
            >
              Открыть доступ
            </Link>
          ) : null}
        </div>

        <div className="metric-tile hidden min-w-[8rem] px-3 py-2 text-sm sm:block">
          <p className="workspace-kicker">AI</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {access.usage.count}
            {typeof access.usage.limit === "number" ? ` / ${access.usage.limit}` : ""}
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <div className="mt-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <p>{notice}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              className="action-button action-button--secondary px-4 py-2.5 text-sm"
              href="/nutrition?section=log&panel=foods"
            >
              Продукты
            </Link>
            <Link
              className="action-button action-button--soft px-4 py-2.5 text-sm"
              href="/nutrition?section=log&panel=log"
            >
              Дневник
            </Link>
          </div>
        </div>
      ) : null}

      <input
        accept="image/*"
        capture="environment"
        className="hidden"
        data-testid="nutrition-photo-camera-input"
        onChange={(event) => handleFileSelection(event.currentTarget)}
        ref={cameraInputRef}
        type="file"
      />
      <input
        accept="image/*"
        className="hidden"
        data-testid="nutrition-photo-gallery-input"
        onChange={(event) => handleFileSelection(event.currentTarget)}
        ref={galleryInputRef}
        type="file"
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              className="action-button action-button--primary"
              data-testid="nutrition-photo-open-camera"
              disabled={!access.allowed}
              onClick={() => cameraInputRef.current?.click()}
              type="button"
            >
              <Camera size={16} strokeWidth={2.2} />
              Снять фото
            </button>
            <button
              className="action-button action-button--secondary"
              data-testid="nutrition-photo-open-gallery"
              disabled={!access.allowed}
              onClick={() => galleryInputRef.current?.click()}
              type="button"
            >
              <ImagePlus size={16} strokeWidth={2.2} />
              Галерея
            </button>
          </div>

          <p className="text-sm text-muted">{fileLabel}</p>

          {previewUrl ? (
            <div
              className="overflow-hidden rounded-[1.25rem] border border-border bg-white"
              data-testid="nutrition-photo-preview"
            >
              <Image
                alt="Предпросмотр фото блюда"
                className="h-60 w-full object-cover"
                height={240}
                src={previewUrl}
                unoptimized
                width={640}
              />
            </div>
          ) : (
            <div className="surface-panel surface-panel--soft flex min-h-56 items-center justify-center rounded-[1.25rem] px-5 py-6 text-center text-sm leading-6 text-muted">
              Здесь появится кадр с камеры. Лучше всего работают чёткие фото тарелки или упаковки при хорошем свете.
            </div>
          )}

          <label className="grid gap-2 text-sm text-muted">
            Контекст для AI
            <textarea
              className={`${inputClassName} min-h-24 resize-y`}
              disabled={!access.allowed}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Например: обед после тренировки, на фото рис, курица и овощи."
              value={notes}
            />
          </label>

          <button
            className="action-button action-button--primary"
            data-testid="nutrition-photo-analyze"
            disabled={isPending || !file || !access.allowed}
            onClick={runAnalysis}
            type="button"
          >
            {isPending ? "Анализирую фото..." : "Проанализировать фото"}
          </button>
        </div>

        <div className="surface-panel surface-panel--soft p-3.5 sm:p-4">
          {result ? (
            <div className="grid gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-foreground">
                    {result.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {result.summary}
                  </p>
                </div>
                <div className="pill">AI: {formatConfidence(result.confidence)}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Metric label="Калории" value={`${result.estimatedKcal} ккал`} />
                <Metric label="Белки" value={`${result.macros.protein} г`} />
                <Metric label="Жиры" value={`${result.macros.fat} г`} />
                <Metric label="Углеводы" value={`${result.macros.carbs} г`} />
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-white/75 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    Что видно на фото
                  </p>
                  <ul className="mt-2 grid gap-1.5 text-sm leading-6 text-muted">
                    {result.items.map((item) => (
                      <li key={`${item.name}-${item.portion}`}>
                        {item.name} · {item.portion} · {formatConfidence(item.confidence)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-white/75 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    Что делать дальше
                  </p>
                  <ul className="mt-2 grid gap-1.5 text-sm leading-6 text-muted">
                    {result.suggestions.map((suggestion) => (
                      <li key={suggestion}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className="action-button action-button--secondary"
                  data-testid="nutrition-photo-save-food"
                  disabled={activeImportMode !== null}
                  onClick={() => importResult("food")}
                  type="button"
                >
                  {activeImportMode === "food" ? (
                    <>
                      <LoaderCircle className="animate-spin" size={16} strokeWidth={2.2} />
                      Сохраняю...
                    </>
                  ) : (
                    "Сохранить продукт"
                  )}
                </button>
                <button
                  className="action-button action-button--primary"
                  data-testid="nutrition-photo-save-meal"
                  disabled={activeImportMode !== null}
                  onClick={() => importResult("meal")}
                  type="button"
                >
                  {activeImportMode === "meal" ? (
                    <>
                      <LoaderCircle className="animate-spin" size={16} strokeWidth={2.2} />
                      Добавляю...
                    </>
                  ) : (
                    "Добавить в дневник"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-2 text-sm leading-6 text-muted">
              <p>
                После анализа здесь появятся состав блюда, ориентировочные калории и КБЖУ.
              </p>
              <p>
                Результат можно сохранить как новый продукт или одним действием добавить в дневник питания.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-tile p-2.5">
      <p className="workspace-kicker">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </article>
  );
}
