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
    <section className="card p-6">
      <div className="mb-4">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
          Контекст дня
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-foreground">
          Вес и заметка
        </h3>
        <p className="mt-2 text-sm leading-7 text-muted">
          Эти данные помогают видеть самочувствие и восстановление по тренировке.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr_auto] md:items-end">
        <label className="grid gap-2 text-sm text-muted">
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

        <label className="grid gap-2 text-sm text-muted">
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
          className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
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
