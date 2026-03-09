"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

type Exercise = {
  id: string;
  title: string;
  muscle_group: string;
  description: string | null;
  note: string | null;
  is_archived: boolean;
  updated_at: string;
};

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function ExerciseLibraryManager({
  initialExercises,
}: {
  initialExercises: Exercise[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const activeExercises = useMemo(
    () => initialExercises.filter((exercise) => !exercise.is_archived),
    [initialExercises],
  );
  const archivedExercises = useMemo(
    () => initialExercises.filter((exercise) => exercise.is_archived),
    [initialExercises],
  );

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setMuscleGroup("");
    setDescription("");
    setNote("");
  }

  function selectForEdit(exercise: Exercise) {
    setEditingId(exercise.id);
    setTitle(exercise.title);
    setMuscleGroup(exercise.muscle_group);
    setDescription(exercise.description ?? "");
    setNote(exercise.note ?? "");
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

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="card p-6">
        <div className="mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Библиотека упражнений
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            {editingId ? "Редактирование упражнения" : "Добавить упражнение"}
          </h2>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm text-muted">
            Название
            <input
              className={inputClassName}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Присед с гантелью"
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
            Описание
            <textarea
              className={`${inputClassName} min-h-28 resize-y`}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Короткое описание техники или назначения"
              value={description}
            />
          </label>

          <label className="grid gap-2 text-sm text-muted">
            Заметка
            <textarea
              className={`${inputClassName} min-h-24 resize-y`}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Например: избегать большого веса из-за колена"
              value={note}
            />
          </label>
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
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending || !title.trim() || !muscleGroup.trim()}
            onClick={submit}
            type="button"
          >
            {isPending
              ? "Сохраняю..."
              : editingId
                ? "Сохранить изменения"
                : "Добавить упражнение"}
          </button>
          {editingId ? (
            <button
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
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
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Активные
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                Активные упражнения
              </h2>
            </div>
            <div className="pill">{activeExercises.length}</div>
          </div>

          <div className="grid gap-3">
            {activeExercises.length ? (
              activeExercises.map((exercise) => (
                <article
                  className="rounded-2xl border border-border bg-white/60 p-4"
                  key={exercise.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {exercise.title}
                      </p>
                      <p className="text-sm text-muted">
                        {exercise.muscle_group}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                        onClick={() => selectForEdit(exercise)}
                        type="button"
                      >
                        Редактировать
                      </button>
                      <button
                        className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
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
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-muted">
                Пока нет активных упражнений. Начни с базовой библиотеки для
                своей первой программы.
              </p>
            )}
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Архив
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                Архив
              </h2>
            </div>
            <div className="pill">{archivedExercises.length}</div>
          </div>

          <div className="grid gap-3">
            {archivedExercises.length ? (
              archivedExercises.map((exercise) => (
                <article
                  className="rounded-2xl border border-border bg-white/60 p-4"
                  key={exercise.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {exercise.title}
                      </p>
                      <p className="text-sm text-muted">
                        {exercise.muscle_group}
                      </p>
                    </div>
                    <button
                      className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                      onClick={() => toggleArchived(exercise, false)}
                      type="button"
                    >
                      Вернуть
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-muted">
                Архив пока пуст. Сюда будут попадать упражнения, которые ты
                убрала из активной библиотеки.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
