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
    <section className="rounded-[1.8rem] bg-[color:var(--surface-bright)] px-6 py-6 shadow-[0_24px_64px_-50px_rgba(24,29,63,0.22)]">
      <div className="mb-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[color:var(--accent)]">
          Контекст дня
        </p>
        <h3 className="mt-2 font-headline text-[1.7rem] font-bold text-[color:var(--foreground)]">
          Вес и заметка
        </h3>
        <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
          Эти данные помогают видеть самочувствие и восстановление по тренировке.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr_auto] md:items-end">
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
          className="rounded-[1rem] bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-[color:var(--on-primary)] shadow-[0_22px_48px_-34px_rgba(0,64,224,0.55)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
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
