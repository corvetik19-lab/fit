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
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60";

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
      setError("Сначала получи AI-разбор фото, а потом сохраняй его в питание.");
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
            ? `${baseNotice} Изображение не удалось сохранить в storage, но запись в питании уже создана.`
            : baseNotice,
        );

        router.refresh();
      } finally {
        setActiveImportMode(null);
      }
    });
  }

  return (
    <section className="card card--hero p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="workspace-kicker">AI-помощник</p>
          <h2 className="app-display mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            Сними еду и сразу загрузи её в приложение
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            Камера нужна не только для оценки КБЖУ. После анализа снимок можно
            сохранить как новый продукт и сразу добавить в дневник питания.
          </p>
          {!access.allowed ? (
            <Link
              className="action-button action-button--secondary mt-3"
              href="/settings#billing-center"
            >
              Открыть billing center
            </Link>
          ) : null}
        </div>

        <div className="surface-panel surface-panel--soft px-5 py-4 text-sm text-muted">
          <p>
            Использовано: {access.usage.count}
            {typeof access.usage.limit === "number" ? ` / ${access.usage.limit}` : ""}
          </p>
          <p className="mt-1">Источник доступа: {access.source}</p>
          {access.reason ? (
            <p className="mt-2 text-amber-700">{access.reason}</p>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <div className="mt-5 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p>{notice}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              className="action-button action-button--secondary"
              href="/nutrition?section=log&panel=foods"
            >
              Открыть продукты
            </Link>
            <Link
              className="action-button action-button--soft"
              href="/nutrition?section=log&panel=log"
            >
              Открыть дневник
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="action-button action-button--soft"
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
              Из галереи
            </button>
          </div>

          <p className="text-sm text-muted">{fileLabel}</p>

          {previewUrl ? (
            <div
              className="overflow-hidden rounded-[28px] border border-white/60 bg-white/80 shadow-[0_22px_60px_rgba(0,64,224,0.12)]"
              data-testid="nutrition-photo-preview"
            >
              <Image
                alt="Предпросмотр фото блюда"
                className="h-72 w-full object-cover"
                height={288}
                src={previewUrl}
                unoptimized
                width={640}
              />
            </div>
          ) : (
            <div className="surface-panel surface-panel--soft flex min-h-72 items-center justify-center rounded-[28px] px-5 py-6 text-center text-sm leading-7 text-muted">
              Здесь появится кадр с камеры. Лучше всего работают чёткие фото
              тарелки или упаковки при хорошем свете.
            </div>
          )}

          <label className="grid gap-2 text-sm text-muted">
            Контекст для AI
            <textarea
              className={`${inputClassName} min-h-32 resize-y`}
              disabled={!access.allowed}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Например: это был обед после тренировки, на фото рис, курица и овощи."
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

        <div className="surface-panel surface-panel--soft p-5">
          {result ? (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {result.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {result.summary}
                  </p>
                </div>
                <div className="pill">
                  Уверенность: {formatConfidence(result.confidence)}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="surface-panel p-4">
                  <p className="text-sm text-muted">Калории</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {result.estimatedKcal} ккал
                  </p>
                </article>
                <article className="surface-panel p-4">
                  <p className="text-sm text-muted">Белки</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {result.macros.protein} г
                  </p>
                </article>
                <article className="surface-panel p-4">
                  <p className="text-sm text-muted">Жиры</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {result.macros.fat} г
                  </p>
                </article>
                <article className="surface-panel p-4">
                  <p className="text-sm text-muted">Углеводы</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {result.macros.carbs} г
                  </p>
                </article>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-white/70 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Что AI увидел на фото
                  </p>
                  <ul className="mt-3 grid gap-2 text-sm leading-7 text-muted">
                    {result.items.map((item) => (
                      <li key={`${item.name}-${item.portion}`}>
                        {item.name} · {item.portion} · уверенность{" "}
                        {formatConfidence(item.confidence)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-white/70 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Что делать дальше
                  </p>
                  <ul className="mt-3 grid gap-2 text-sm leading-7 text-muted">
                    {result.suggestions.map((suggestion) => (
                      <li key={suggestion}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
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
                      Сохраняю продукт...
                    </>
                  ) : (
                    "Сохранить как продукт"
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
                      Добавляю в дневник...
                    </>
                  ) : (
                    "Сохранить и добавить в дневник"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 text-sm leading-7 text-muted">
              <p>
                После анализа здесь появятся состав блюда, ориентировочные калории и
                КБЖУ.
              </p>
              <p>
                Дальше результат можно будет одним нажатием сохранить как новый
                продукт или сразу занести в дневник питания.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
