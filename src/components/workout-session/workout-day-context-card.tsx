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
    <section className="surface-panel p-3.5 sm:p-4">
      <div className="mb-3">
        <p className="workspace-kicker">Контекст дня</p>
        <h3 className="mt-1 text-lg font-semibold text-foreground">
          Вес и заметка
        </h3>
        <p className="mt-1 text-sm leading-5 text-muted">
          Коротко зафиксируй самочувствие, чтобы видеть связь нагрузки и восстановления.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr_auto] md:items-end">
        <label className="grid gap-2 text-sm text-muted">
          Вес утром, кг
          <input
            className={inputClassName}
            disabled={!dayIsLocked || isPending || isSyncing}
            inputMode="decimal"
            onChange={(event) => onBodyWeightChange(event.target.value)}
            placeholder="82.4"
            value={dayBodyWeightValue}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Заметка
          <textarea
            className={textAreaClassName}
            disabled={!dayIsLocked || isPending || isSyncing}
            onChange={(event) => onSessionNoteChange(event.target.value)}
            placeholder="Сон, энергия, тяжёлые подходы, что далось лучше обычного"
            value={daySessionNoteValue}
          />
        </label>

        <button
          className="action-button action-button--primary h-11 px-4 text-sm"
          disabled={!dayIsLocked || isPending || isSyncing}
          onClick={onSave}
          type="button"
        >
          Сохранить
        </button>
      </div>
    </section>
  );
}
