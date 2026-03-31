"use client";

import Link from "next/link";
import { Camera, ImagePlus } from "lucide-react";
import { startTransition, useMemo, useRef, useState } from "react";

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

export function NutritionPhotoAnalysis({
  access,
}: NutritionPhotoAnalysisProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<MealPhotoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const fileLabel = useMemo(() => {
    if (!file) {
      return "Фото ещё не выбрано";
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return `${file.name} · ${sizeMb} МБ`;
  }, [file]);

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
    setIsPending(true);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("image", file);
        formData.set("notes", notes.trim());

        const response = await fetch("/api/ai/meal-photo", {
          method: "POST",
          body: formData,
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

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            AI-помощник
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Фото еды прямо из приложения
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            Сними блюдо на камеру телефона или выбери фото из галереи. AI
            оценит состав, ориентировочную калорийность и КБЖУ. Это
            online-only анализ: данные не записываются в дневник автоматически.
          </p>
          {!access.allowed ? (
            <Link
              className="mt-3 inline-flex rounded-full border border-border bg-white/80 px-4 py-2 font-semibold text-foreground transition hover:bg-white"
              href="/settings#billing-center"
            >
              Открыть billing center
            </Link>
          ) : null}
        </div>

        <div className="rounded-3xl border border-border bg-white/60 px-5 py-4 text-sm text-muted">
          <p>
            Использовано: {access.usage.count}
            {typeof access.usage.limit === "number"
              ? ` / ${access.usage.limit}`
              : ""}
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

      <input
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        ref={cameraInputRef}
        type="file"
      />
      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        ref={galleryInputRef}
        type="file"
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/15 bg-[color-mix(in_srgb,var(--accent-soft)_74%,white)] px-5 py-3 text-sm font-semibold text-accent transition hover:bg-[color-mix(in_srgb,var(--accent-soft)_84%,white)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!access.allowed}
              onClick={() => cameraInputRef.current?.click()}
              type="button"
            >
              <Camera size={16} strokeWidth={2.2} />
              Снять фото
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white/82 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!access.allowed}
              onClick={() => galleryInputRef.current?.click()}
              type="button"
            >
              <ImagePlus size={16} strokeWidth={2.2} />
              Из галереи
            </button>
          </div>

          <p className="text-sm text-muted">{fileLabel}</p>

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
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending || !file || !access.allowed}
            onClick={runAnalysis}
            type="button"
          >
            {isPending ? "Анализирую фото..." : "Проанализировать фото"}
          </button>
        </div>

        <div className="rounded-3xl border border-border bg-white/60 p-5">
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
                <article className="rounded-2xl border border-border bg-white/70 p-4">
                  <p className="text-sm text-muted">Калории</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {result.estimatedKcal} ккал
                  </p>
                </article>
                <article className="rounded-2xl border border-border bg-white/70 p-4">
                  <p className="text-sm text-muted">Белки</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {result.macros.protein} г
                  </p>
                </article>
                <article className="rounded-2xl border border-border bg-white/70 p-4">
                  <p className="text-sm text-muted">Жиры</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {result.macros.fat} г
                  </p>
                </article>
                <article className="rounded-2xl border border-border bg-white/70 p-4">
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

              <p className="text-sm leading-7 text-muted">
                Если оценка выглядит правдоподобно, потом можно вручную занести
                приём пищи в лог и использовать этот разбор как ориентир по
                составу и КБЖУ.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 text-sm leading-7 text-muted">
              <p>
                Здесь появится оценка блюда после анализа фото: основные
                ингредиенты, ориентировочные калории и КБЖУ.
              </p>
              <p>
                Лучше всего работают чёткие фотографии тарелки или упаковки при
                хорошем освещении и без лишних объектов в кадре.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
