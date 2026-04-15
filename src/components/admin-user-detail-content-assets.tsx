"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { AdminUserDetailData } from "@/components/admin-user-detail-model";
import { EmptyState } from "@/components/admin-user-detail-primitives";
import { isAbsoluteHttpUrl } from "@/lib/image-url";

const inputClassName =
  "w-full rounded-2xl border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_92%,var(--surface))] px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

type ContentAssetType = "exercise" | "food";

function AssetPreview({
  fallback,
  imageUrl,
  title,
}: {
  fallback: string;
  imageUrl: string | null;
  title: string;
}) {
  const resolvedImageUrl =
    typeof imageUrl === "string" && isAbsoluteHttpUrl(imageUrl)
      ? imageUrl.trim()
      : null;

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_88%,var(--surface))]">
      {resolvedImageUrl ? (
        <Image
          alt={title}
          className="h-24 w-full object-cover"
          height={96}
          src={resolvedImageUrl}
          unoptimized
          width={96}
        />
      ) : (
        <div className="flex h-24 items-center justify-center bg-[color-mix(in_srgb,var(--accent-soft)_22%,var(--surface-elevated))] px-3 text-center text-xs font-medium text-accent">
          {fallback}
        </div>
      )}
    </div>
  );
}

function AssetCard({
  canManage,
  defaultImageUrl,
  fallback,
  meta,
  onChange,
  onSave,
  pending,
  title,
  value,
}: {
  canManage: boolean;
  defaultImageUrl: string | null;
  fallback: string;
  meta: string;
  onChange: (nextValue: string) => void;
  onSave: () => void;
  pending: boolean;
  title: string;
  value: string;
}) {
  return (
    <article className="surface-panel surface-panel--soft p-4">
      <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
        <AssetPreview
          fallback={fallback}
          imageUrl={value.trim() || defaultImageUrl}
          title={title}
        />

        <div>
          <p className="text-lg font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted">{meta}</p>

          {canManage ? (
            <div className="mt-4 grid gap-3">
              <input
                className={inputClassName}
                onChange={(event) => onChange(event.target.value)}
                placeholder="https://..."
                type="url"
                value={value}
              />
              <div className="flex flex-wrap gap-3">
                <button
                  className="action-button action-button--primary px-4 py-2 text-sm"
                  disabled={pending}
                  onClick={onSave}
                  type="button"
                >
                  {pending ? "Сохраняю..." : "Сохранить картинку"}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">
              Редактирование доступно только главному super-admin.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function AdminUserContentSection({
  canManageContentAssets,
  detail,
  onUpdated,
  userId,
}: {
  canManageContentAssets: boolean;
  detail: AdminUserDetailData;
  onUpdated: () => void;
  userId: string;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const initialDrafts = useMemo(
    () =>
      Object.fromEntries(
        [
          ...detail.recentExercises.map((exercise) => [
            `exercise:${exercise.id}`,
            exercise.image_url ?? "",
          ]),
          ...detail.recentFoods.map((food) => [`food:${food.id}`, food.image_url ?? ""]),
        ],
      ),
    [detail.recentExercises, detail.recentFoods],
  );

  useEffect(() => {
    setDrafts(initialDrafts);
  }, [initialDrafts]);

  async function saveAsset(entityType: ContentAssetType, entityId: string) {
    const draftKey = `${entityType}:${entityId}`;

    setError(null);
    setNotice(null);
    setPendingKey(draftKey);

    try {
      const response = await fetch(`/api/admin/users/${userId}/content-assets`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType,
          entityId,
          imageUrl: drafts[draftKey]?.trim() || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось обновить изображение.");
        return;
      }

      setNotice(
        entityType === "exercise"
          ? "Изображение упражнения обновлено."
          : "Изображение продукта обновлено.",
      );
      onUpdated();
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <section className="grid gap-6" data-testid="admin-user-detail-content-section">
      <section className="card p-6">
        <div className="mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Контент
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Изображения упражнений и продуктов
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Здесь можно быстро подправить карточки, которые видит пользователь в
            библиотеке упражнений и базе питания. Пустое поле очистит картинку.
          </p>
        </div>

        {error ? (
          <p className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/12 px-4 py-3 text-sm text-red-900">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p className="mb-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-900">
            {notice}
          </p>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-foreground">Упражнения</p>
                <p className="text-sm text-muted">
                  Последние карточки из пользовательской библиотеки.
                </p>
              </div>
              <div className="pill">{detail.recentExercises.length}</div>
            </div>

            {detail.recentExercises.length ? (
              detail.recentExercises.map((exercise) => {
                const draftKey = `exercise:${exercise.id}`;

                return (
                  <AssetCard
                    canManage={canManageContentAssets}
                    defaultImageUrl={exercise.image_url}
                    fallback={exercise.muscle_group || "Упражнение"}
                    key={exercise.id}
                    meta={`${exercise.muscle_group}${exercise.is_archived ? " · архив" : ""}`}
                    onChange={(nextValue) =>
                      setDrafts((current) => ({
                        ...current,
                        [draftKey]: nextValue,
                      }))
                    }
                    onSave={() => saveAsset("exercise", exercise.id)}
                    pending={pendingKey === draftKey}
                    title={exercise.title}
                    value={drafts[draftKey] ?? ""}
                  />
                );
              })
            ) : (
              <EmptyState>У пользователя пока нет упражнений в библиотеке.</EmptyState>
            )}
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-foreground">Продукты</p>
                <p className="text-sm text-muted">
                  Последние карточки продуктов, видимые в nutrition flow.
                </p>
              </div>
              <div className="pill">{detail.recentFoods.length}</div>
            </div>

            {detail.recentFoods.length ? (
              detail.recentFoods.map((food) => {
                const draftKey = `food:${food.id}`;

                return (
                  <AssetCard
                    canManage={canManageContentAssets}
                    defaultImageUrl={food.image_url}
                    fallback={food.source === "open_food_facts" ? "Импорт" : "Свой продукт"}
                    key={food.id}
                    meta={`${food.brand ?? "Без бренда"} · ${food.source === "open_food_facts" ? "Open Food Facts" : "Своя карточка"}`}
                    onChange={(nextValue) =>
                      setDrafts((current) => ({
                        ...current,
                        [draftKey]: nextValue,
                      }))
                    }
                    onSave={() => saveAsset("food", food.id)}
                    pending={pendingKey === draftKey}
                    title={food.name}
                    value={drafts[draftKey] ?? ""}
                  />
                );
              })
            ) : (
              <EmptyState>У пользователя пока нет сохранённых продуктов.</EmptyState>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
