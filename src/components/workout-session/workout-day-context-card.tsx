"use client";

export function WorkoutDayContextCard({
  dayBodyWeightValue,
  dayIsLocked,
  daySessionNoteValue,
  inputClassName,
  isPending,
  isSyncing,
  onBodyWeightChange,
  onSave,
  onSessionNoteChange,
  textAreaClassName,
}: {
  dayBodyWeightValue: string;
  dayIsLocked: boolean;
  daySessionNoteValue: string;
  inputClassName: string;
  isPending: boolean;
  isSyncing: boolean;
  onBodyWeightChange: (value: string) => void;
  onSave: () => void;
  onSessionNoteChange: (value: string) => void;
  textAreaClassName: string;
}) {
  return (
    <section className="surface-panel p-4 sm:p-5">
      <div className="mb-3.5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[color:var(--accent)]">
          Контекст дня
        </p>
        <h3 className="mt-1.5 text-lg font-semibold text-[color:var(--foreground)] sm:text-xl">
          Вес и заметка
        </h3>
        <p className="mt-1.5 text-sm leading-5 text-[color:var(--muted)]">
          Эти данные помогают видеть самочувствие и восстановление по тренировке.
        </p>
      </div>

      <div className="grid gap-3.5 md:grid-cols-[0.8fr_1.2fr_auto] md:items-end">
        <label className="grid gap-2 text-sm text-[color:var(--muted)]">
          Вес тела утром, кг
          <input
            className={inputClassName}
            disabled={!dayIsLocked || isPending || isSyncing}
            inputMode="decimal"
            onChange={(event) => onBodyWeightChange(event.target.value)}
            placeholder="Например, 82.4"
            value={dayBodyWeightValue}
          />
        </label>

        <label className="grid gap-2 text-sm text-[color:var(--muted)]">
          Заметка по тренировке
          <textarea
            className={textAreaClassName}
            disabled={!dayIsLocked || isPending || isSyncing}
            onChange={(event) => onSessionNoteChange(event.target.value)}
            placeholder="Сон, самочувствие, тяжёлые моменты, что далось лучше обычного"
            value={daySessionNoteValue}
          />
        </label>

        <button
          className="action-button action-button--primary h-11 px-4 text-sm"
          disabled={!dayIsLocked || isPending || isSyncing}
          onClick={onSave}
          type="button"
        >
          Сохранить контекст
        </button>
      </div>
    </section>
  );
}
