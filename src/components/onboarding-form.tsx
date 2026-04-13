"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

type GoalType = "fat_loss" | "maintenance" | "muscle_gain" | "performance";

type OnboardingFormProps = {
  initialValues: {
    fullName: string;
    age: string;
    sex: string;
    heightCm: string;
    weightKg: string;
    fitnessLevel: string;
    equipment: string;
    injuries: string;
    dietaryPreferences: string;
    goalType: GoalType;
    targetWeightKg: string;
    weeklyTrainingDays: string;
  };
  userEmail: string;
};

const inputClassName =
  "w-full rounded-[1.75rem] border border-border bg-white/84 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function OnboardingForm({
  initialValues,
  userEmail,
}: OnboardingFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [age, setAge] = useState(initialValues.age);
  const [sex, setSex] = useState(initialValues.sex);
  const [heightCm, setHeightCm] = useState(initialValues.heightCm);
  const [weightKg, setWeightKg] = useState(initialValues.weightKg);
  const [fitnessLevel, setFitnessLevel] = useState(initialValues.fitnessLevel);
  const [equipment, setEquipment] = useState(initialValues.equipment);
  const [injuries, setInjuries] = useState(initialValues.injuries);
  const [dietaryPreferences, setDietaryPreferences] = useState(
    initialValues.dietaryPreferences,
  );
  const [goalType, setGoalType] = useState<GoalType>(initialValues.goalType);
  const [targetWeightKg, setTargetWeightKg] = useState(
    initialValues.targetWeightKg,
  );
  const [weeklyTrainingDays, setWeeklyTrainingDays] = useState(
    initialValues.weeklyTrainingDays,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canSubmit = useMemo(
    () =>
      Boolean(
        fullName.trim() &&
          age.trim() &&
          sex.trim() &&
          heightCm.trim() &&
          weightKg.trim() &&
          fitnessLevel.trim() &&
          weeklyTrainingDays.trim(),
      ),
    [
      age,
      fitnessLevel,
      fullName,
      heightCm,
      sex,
      weightKg,
      weeklyTrainingDays,
    ],
  );

  function submit() {
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch("/api/onboarding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            age: Number(age),
            sex,
            heightCm: Number(heightCm),
            weightKg: Number(weightKg),
            fitnessLevel,
            equipment: splitList(equipment),
            injuries: splitList(injuries),
            dietaryPreferences: splitList(dietaryPreferences),
            goalType,
            targetWeightKg: targetWeightKg.trim()
              ? Number(targetWeightKg)
              : null,
            weeklyTrainingDays: Number(weeklyTrainingDays),
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось сохранить анкету.");
          return;
        }

        setNotice("Профиль сохранён. Переходим в приложение.");
        router.replace("/dashboard");
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <div className="card w-full p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Базовый профиль
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Заполни анкету под свой режим и цели
          </h2>
        </div>
        <div className="pill">{userEmail}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-muted">
          Имя
          <input
            className={inputClassName}
            onChange={(event) => setFullName(event.target.value)}
            type="text"
            value={fullName}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Возраст
          <input
            className={inputClassName}
            min={13}
            onChange={(event) => setAge(event.target.value)}
            type="number"
            value={age}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Пол
          <select
            className={inputClassName}
            onChange={(event) => setSex(event.target.value)}
            value={sex}
          >
            <option value="">Выбери вариант</option>
            <option value="female">Женщина</option>
            <option value="male">Мужчина</option>
            <option value="other">Другое</option>
            <option value="prefer_not_to_say">Не указывать</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Уровень подготовки
          <select
            className={inputClassName}
            onChange={(event) => setFitnessLevel(event.target.value)}
            value={fitnessLevel}
          >
            <option value="">Выбери уровень</option>
            <option value="beginner">Начинающий</option>
            <option value="intermediate">Средний</option>
            <option value="advanced">Продвинутый</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Рост, см
          <input
            className={inputClassName}
            min={100}
            onChange={(event) => setHeightCm(event.target.value)}
            type="number"
            value={heightCm}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Вес, кг
          <input
            className={inputClassName}
            min={30}
            onChange={(event) => setWeightKg(event.target.value)}
            step="0.1"
            type="number"
            value={weightKg}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Цель
          <select
            className={inputClassName}
            onChange={(event) => setGoalType(event.target.value as GoalType)}
            value={goalType}
          >
            <option value="fat_loss">Снижение веса</option>
            <option value="maintenance">Поддержание</option>
            <option value="muscle_gain">Набор мышц</option>
            <option value="performance">Результативность</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Тренировок в неделю
          <input
            className={inputClassName}
            max={7}
            min={1}
            onChange={(event) => setWeeklyTrainingDays(event.target.value)}
            type="number"
            value={weeklyTrainingDays}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted md:col-span-2">
          Целевой вес, кг
          <input
            className={inputClassName}
            onChange={(event) => setTargetWeightKg(event.target.value)}
            placeholder="Необязательно"
            step="0.1"
            type="number"
            value={targetWeightKg}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted md:col-span-2">
          Доступное оборудование
          <textarea
            className={`${inputClassName} min-h-28 resize-y`}
            onChange={(event) => setEquipment(event.target.value)}
            placeholder="Например: штанга, гантели, турник"
            value={equipment}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted md:col-span-2">
          Ограничения или травмы
          <textarea
            className={`${inputClassName} min-h-24 resize-y`}
            onChange={(event) => setInjuries(event.target.value)}
            placeholder="Через запятую, если есть"
            value={injuries}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted md:col-span-2">
          Пищевые ограничения и предпочтения
          <textarea
            className={`${inputClassName} min-h-24 resize-y`}
            onChange={(event) => setDietaryPreferences(event.target.value)}
            placeholder="Например: без лактозы, высокобелковый рацион"
            value={dietaryPreferences}
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

      <button
        className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending || !canSubmit}
        onClick={submit}
        type="button"
      >
        {isPending ? "Сохраняю..." : "Сохранить и продолжить"}
      </button>
    </div>
  );
}
