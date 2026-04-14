"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import { isAbsoluteHttpUrl } from "@/lib/image-url";

type Exercise = {
  id: string;
  title: string;
  muscle_group: string;
  description: string | null;
  note: string | null;
  image_url: string | null;
  is_archived: boolean;
  updated_at: string;
};

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function ExercisePreview({
  imageUrl,
  muscleGroup,
  title,
}: {
  imageUrl: string | null;
  muscleGroup: string;
  title: string;
}) {
  const resolvedImageUrl =
    typeof imageUrl === "string" && isAbsoluteHttpUrl(imageUrl)
      ? imageUrl.trim()
      : null;

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border bg-white/78">
      {resolvedImageUrl ? (
        <Image
          alt={title}
          className="h-36 w-full object-cover"
          height={144}
          src={resolvedImageUrl}
          unoptimized
          width={288}
        />
      ) : (
        <div className="flex h-36 items-center justify-center bg-[color-mix(in_srgb,var(--accent-soft)_60%,white)] px-4 text-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Упражнение
            </p>
            <p className="mt-2 text-sm text-foreground">{muscleGroup || "Свой шаблон"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ExerciseLibraryManager({
  initialExercises,
  initialNextOffset = null,
  initialTotalCount = initialExercises.length,
}: {
  initialExercises: Exercise[];
  initialNextOffset?: number | null;
  initialTotalCount?: number;
}) {
  const router = useRouter();
  const [loadedExercises, setLoadedExercises] = useState(initialExercises);
  const [nextOffset, setNextOffset] = useState<number | null>(initialNextOffset);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [title, setTitle] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setLoadedExercises(initialExercises);
    setNextOffset(initialNextOffset);
    setTotalCount(initialTotalCount);
  }, [initialExercises, initialNextOffset, initialTotalCount]);

  const activeExercises = useMemo(
    () => loadedExercises.filter((exercise) => !exercise.is_archived),
    [loadedExercises],
  );
  const archivedExercises = useMemo(
    () => loadedExercises.filter((exercise) => exercise.is_archived),
    [loadedExercises],
  );

  const hasMore = nextOffset !== null && loadedExercises.length < totalCount;

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setMuscleGroup("");
    setDescription("");
    setNote("");
    setImageUrl("");
  }

  function selectForEdit(exercise: Exercise) {
    setEditingId(exercise.id);
    setTitle(exercise.title);
    setMuscleGroup(exercise.muscle_group);
    setDescription(exercise.description ?? "");
    setNote(exercise.note ?? "");
    setImageUrl(exercise.image_url ?? "");
    setError(null);
    setNotice(null);
  }

  function submit() {
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const endpoint = editingId
          ? `/api/exercises/${editingId}`
          : "/api/exercises";
        const method = editingId ? "PATCH" : "POST";
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            muscleGroup: muscleGroup.trim(),
            description: toNullable(description),
            note: toNullable(note),
            imageUrl: toNullable(imageUrl),
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось сохранить упражнение.");
          return;
        }

        setNotice(
          editingId
            ? "Упражнение обновлено."
            : "Упражнение добавлено в библиотеку.",
        );
        resetForm();
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  function toggleArchived(exercise: Exercise, nextState: boolean) {
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/exercises/${exercise.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isArchived: nextState,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось изменить статус упражнения.");
          return;
        }

        setNotice(
          nextState
            ? "Упражнение отправлено в архив."
            : "Упражнение возвращено из архива.",
        );
        if (editingId === exercise.id && nextState) {
          resetForm();
        }
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  function loadMoreExercises() {
    if (nextOffset === null || isLoadingMore) {
      return;
    }

    setError(null);
    setIsLoadingMore(true);

    startTransition(async () => {
      try {
        const searchParams = new URLSearchParams({
          includeArchived: "true",
          limit: "120",
          offset: String(nextOffset),
        });
        const response = await fetch(`/api/exercises?${searchParams.toString()}`);
        const payload = (await response.json().catch(() => null)) as
          | {
              data?: Exercise[];
              message?: string;
              meta?: {
                nextOffset?: number | null;
                total?: number;
              };
            }
          | null;

        if (!response.ok) {
          setError(
            payload?.message ??
              "Не удалось подгрузить оставшиеся упражнения библиотеки.",
          );
          return;
        }

        const appendedExercises = payload?.data ?? [];
        setLoadedExercises((currentExercises) => [
          ...currentExercises,
          ...appendedExercises.filter(
            (nextExercise) =>
              !currentExercises.some(
                (currentExercise) => currentExercise.id === nextExercise.id,
              ),
          ),
        ]);
        setNextOffset(payload?.meta?.nextOffset ?? null);
        setTotalCount(payload?.meta?.total ?? totalCount);
      } finally {
        setIsLoadingMore(false);
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="card card--hero p-6">
        <div className="mb-5">
          <p className="workspace-kicker">Библиотека упражнений</p>
          <h2 className="app-display mt-2 text-2xl text-foreground sm:text-3xl">
            {editingId ? "Редактирование упражнения" : "Новое упражнение"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Сохраняй свою библиотеку упражнений со своими обложками. Картинка поможет
            быстрее узнавать движение на телефоне и в шаблонах недели.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
          <ExercisePreview
            imageUrl={toNullable(imageUrl)}
            muscleGroup={muscleGroup.trim()}
            title={title.trim() || "Новое упражнение"}
          />

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm text-muted">
              Название
              <input
                className={inputClassName}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Например, присед с гантелью"
                type="text"
                value={title}
              />
            </label>

            <label className="grid gap-2 text-sm text-muted">
              Группа мышц
              <input
                className={inputClassName}
                onChange={(event) => setMuscleGroup(event.target.value)}
                placeholder="Ноги"
                type="text"
                value={muscleGroup}
              />
            </label>

            <label className="grid gap-2 text-sm text-muted">
              Ссылка на фото
              <input
                className={inputClassName}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://..."
                type="url"
                value={imageUrl}
              />
            </label>

            <label className="grid gap-2 text-sm text-muted">
              Описание
              <textarea
                className={`${inputClassName} min-h-28 resize-y`}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Коротко опиши технику или назначение упражнения."
                value={description}
              />
            </label>

            <label className="grid gap-2 text-sm text-muted">
              Заметка
              <textarea
                className={`${inputClassName} min-h-24 resize-y`}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Например: держать корпус жёстко и не уходить в глубокую амплитуду."
                value={note}
              />
            </label>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p className="mt-4 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="action-button action-button--primary"
            disabled={isPending || !title.trim() || !muscleGroup.trim()}
            onClick={submit}
            type="button"
          >
            {isPending
              ? "Сохраняю..."
              : editingId
                ? "Сохранить упражнение"
                : "Добавить упражнение"}
          </button>
          {editingId ? (
            <button
              className="action-button action-button--secondary"
              onClick={resetForm}
              type="button"
            >
              Отменить редактирование
            </button>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6">
        <section className="card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="workspace-kicker">Активные</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                Текущая библиотека
              </h2>
            </div>
            <div className="pill">{activeExercises.length}</div>
          </div>

          <div className="grid gap-3">
            {activeExercises.length ? (
              activeExercises.map((exercise) => (
                <article className="surface-panel surface-panel--soft p-4" key={exercise.id}>
                  <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
                    <div className="overflow-hidden rounded-[1.25rem] border border-border bg-white/78">
                      {exercise.image_url ? (
                        <Image
                          alt={exercise.title}
                          className="h-24 w-full object-cover"
                          height={96}
                          src={exercise.image_url}
                          unoptimized
                          width={96}
                        />
                      ) : (
                        <div className="flex h-24 items-center justify-center bg-[color-mix(in_srgb,var(--accent-soft)_52%,white)] px-3 text-center text-xs font-medium text-accent">
                          {exercise.muscle_group || "Своя карточка"}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-foreground">
                            {exercise.title}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {exercise.muscle_group}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="action-button action-button--secondary px-4 py-2 text-sm"
                            onClick={() => selectForEdit(exercise)}
                            type="button"
                          >
                            Редактировать
                          </button>
                          <button
                            className="action-button action-button--secondary px-4 py-2 text-sm"
                            onClick={() => toggleArchived(exercise, true)}
                            type="button"
                          >
                            В архив
                          </button>
                        </div>
                      </div>
                      {exercise.description ? (
                        <p className="mt-3 text-sm leading-7 text-muted">
                          {exercise.description}
                        </p>
                      ) : null}
                      {exercise.note ? (
                        <p className="mt-2 text-sm leading-7 text-muted">
                          Заметка: {exercise.note}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-muted">
                Пока нет активных упражнений. Сначала добавь базовые движения для своей
                первой недели.
              </p>
            )}
          </div>

          {hasMore ? (
            <div className="mt-4">
              <button
                className="action-button action-button--secondary"
                disabled={isLoadingMore}
                onClick={loadMoreExercises}
                type="button"
              >
                {isLoadingMore
                  ? "Подгружаю ещё..."
                  : `Загрузить ещё упражнения (${loadedExercises.length} из ${totalCount})`}
              </button>
            </div>
          ) : null}
        </section>

        <section className="card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="workspace-kicker">Архив</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                Архивированные
              </h2>
            </div>
            <div className="pill">{archivedExercises.length}</div>
          </div>

          <div className="grid gap-3">
            {archivedExercises.length ? (
              archivedExercises.map((exercise) => (
                <article className="surface-panel surface-panel--soft p-4" key={exercise.id}>
                  <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
                    <div className="overflow-hidden rounded-[1.25rem] border border-border bg-white/78">
                      {exercise.image_url ? (
                        <Image
                          alt={exercise.title}
                          className="h-24 w-full object-cover"
                          height={96}
                          src={exercise.image_url}
                          unoptimized
                          width={96}
                        />
                      ) : (
                        <div className="flex h-24 items-center justify-center bg-[color-mix(in_srgb,var(--accent-soft)_52%,white)] px-3 text-center text-xs font-medium text-accent">
                          Архив
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          {exercise.title}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {exercise.muscle_group}
                        </p>
                      </div>
                      <button
                        className="action-button action-button--secondary px-4 py-2 text-sm"
                        onClick={() => toggleArchived(exercise, false)}
                        type="button"
                      >
                        Вернуть
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-muted">
                Архив пока пуст. Сюда попадают упражнения, которые ты убрала из активной
                библиотеки.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
