"use client";

import {
  CheckCircle2,
  Dumbbell,
  Flame,
  HeartPulse,
  Utensils,
} from "lucide-react";
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
  "w-full rounded-[1rem] border border-border bg-white/92 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/15";

const goalOptions: Array<{ label: string; value: GoalType }> = [
  { label: "Снижение веса", value: "fat_loss" },
  { label: "Поддержание формы", value: "maintenance" },
  { label: "Набор мышц", value: "muscle_gain" },
  { label: "Выносливость", value: "performance" },
];

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function SectionShell({
  children,
  description,
  index,
  title,
}: {
  children: React.ReactNode;
  description: string;
  index: string;
  title: string;
}) {
  return (
    <section className="surface-panel surface-panel--soft space-y-4 p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] bg-[color-mix(in_srgb,var(--accent-soft)_62%,white)] text-sm font-black text-accent-strong">
          {index}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function InsightCard({
  detail,
  icon: Icon,
  title,
}: {
  detail: string;
  icon: typeof Dumbbell;
  title: string;
}) {
  return (
    <div className="rounded-[1rem] border border-border bg-white/86 p-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-[color-mix(in_srgb,var(--accent-soft)_62%,white)] text-accent-strong">
          <Icon size={18} strokeWidth={2.1} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
        </div>
      </div>
    </div>
  );
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

  const readinessLabel = useMemo(() => {
    if (!weeklyTrainingDays.trim()) {
      return "Выбери частоту";
    }

    return `${weeklyTrainingDays.trim()} трен./нед.`;
  }, [weeklyTrainingDays]);

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

        setNotice("Профиль сохранен. Переходим в рабочее пространство.");
        router.replace("/dashboard");
        router.refresh();
      } catch {
        setError("Сервис анкеты временно недоступен. Попробуй еще раз.");
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <div className="relative">
      <div className="space-y-4 pb-28">
        <section className="surface-panel surface-panel--accent p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <InsightCard
              detail="Точка входа для персонального плана и AI-контекста."
              icon={CheckCircle2}
              title="Профиль"
            />
            <InsightCard
              detail="Уровень, цель и частота помогут собрать нагрузку."
              icon={Dumbbell}
              title="Режим"
            />
            <InsightCard
              detail={`Аккаунт: ${userEmail}`}
              icon={HeartPulse}
              title="Сессия"
            />
          </div>
        </section>

        <SectionShell
          description="Базовые данные нужны для расчета нагрузки и питания."
          index="01"
          title="Биометрия"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-muted sm:col-span-2">
              <span className="pl-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
                Имя
              </span>
              <input
                className={inputClassName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Как к тебе обращаться"
                type="text"
                value={fullName}
              />
            </label>

            <label className="grid gap-2 text-sm text-muted">
              <span className="pl-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
                Возраст
              </span>
              <input
                className={inputClassName}
                min={13}
                onChange={(event) => setAge(event.target.value)}
                type="number"
                value={age}
              />
            </label>

            <label className="grid gap-2 text-sm text-muted">
              <span className="pl-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
                Пол
              </span>
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
              <span className="pl-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
                Рост, см
              </span>
              <input
                className={inputClassName}
                min={100}
                onChange={(event) => setHeightCm(event.target.value)}
                type="number"
                value={heightCm}
              />
            </label>

            <label className="grid gap-2 text-sm text-muted">
              <span className="pl-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
                Вес, кг
              </span>
              <input
                className={inputClassName}
                min={30}
                onChange={(event) => setWeightKg(event.target.value)}
                step="0.1"
                type="number"
                value={weightKg}
              />
            </label>

            <label className="grid gap-2 text-sm text-muted sm:col-span-2">
              <span className="pl-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
                Целевой вес, кг
              </span>
              <input
                className={inputClassName}
                onChange={(event) => setTargetWeightKg(event.target.value)}
                placeholder="Если хочешь зафиксировать цель"
                step="0.1"
                type="number"
                value={targetWeightKg}
              />
            </label>
          </div>
        </SectionShell>

        <SectionShell
          description="Выбери цель, уровень и рабочую частоту тренировок."
          index="02"
          title="Тренировочный режим"
        >
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-muted">
                <span className="pl-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
                  Уровень
                </span>
                <select
                  className={inputClassName}
                  onChange={(event) => setFitnessLevel(event.target.value)}
                  value={fitnessLevel}
                >
                  <option value="">Выбери уровень</option>
                  <option value="beginner">Новичок</option>
                  <option value="intermediate">Средний</option>
                  <option value="advanced">Продвинутый</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-muted">
                <span className="pl-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
                  Цель
                </span>
                <select
                  className={inputClassName}
                  onChange={(event) =>
                    setGoalType(event.target.value as GoalType)
                  }
                  value={goalType}
                >
                  {goalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-[1rem] border border-border bg-white/86 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="workspace-kicker">Частота</p>
                  <p className="mt-2 text-base font-bold text-foreground">
                    Рабочий ритм недели
                  </p>
                </div>
                <span className="pill self-start">{readinessLabel}</span>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                {["3", "4", "5", "6"].map((item) => {
                  const isActive = weeklyTrainingDays === item;
                  return (
                    <button
                      aria-pressed={isActive}
                      className={`rounded-[0.9rem] px-3 py-3 text-sm font-bold transition ${
                        isActive
                          ? "bg-[linear-gradient(135deg,#2563EB,#0891FF,#2DD4BF)] text-white shadow-[0_16px_30px_-22px_rgba(8,145,255,0.45)]"
                          : "bg-[#eef6ff] text-foreground hover:bg-white"
                      }`}
                      key={item}
                      onClick={() => setWeeklyTrainingDays(item)}
                      type="button"
                    >
                      {item}x
                    </button>
                  );
                })}
              </div>

              <label className="mt-4 grid gap-2 text-sm text-muted">
                <span className="pl-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
                  Точное значение
                </span>
                <input
                  className={inputClassName}
                  max={7}
                  min={1}
                  onChange={(event) => setWeeklyTrainingDays(event.target.value)}
                  type="number"
                  value={weeklyTrainingDays}
                />
              </label>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          description="Укажи доступный инвентарь и ограничения, чтобы план был безопаснее."
          index="03"
          title="Оборудование и ограничения"
        >
          <div className="grid gap-3">
            <label className="grid gap-2 text-sm text-muted">
              <span className="pl-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
                Доступное оборудование
              </span>
              <textarea
                className={`${inputClassName} min-h-24 resize-y`}
                onChange={(event) => setEquipment(event.target.value)}
                placeholder="Например: штанга, стойка, скамья, гантели, турник"
                value={equipment}
              />
            </label>

            <label className="grid gap-2 text-sm text-muted">
              <span className="pl-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
                Травмы или ограничения
              </span>
              <textarea
                className={`${inputClassName} min-h-24 resize-y`}
                onChange={(event) => setInjuries(event.target.value)}
                placeholder="Через запятую, если есть важные ограничения"
                value={injuries}
              />
            </label>
          </div>
        </SectionShell>

        <SectionShell
          description="Эти данные помогут AI предлагать более реалистичный рацион."
          index="04"
          title="Питание"
        >
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <InsightCard
                detail="Учитываем белок, восстановление и цель."
                icon={Flame}
                title="Рацион под цель"
              />
              <InsightCard
                detail="Ограничения попадут в контекст AI-коуча."
                icon={Utensils}
                title="Предпочтения"
              />
            </div>

            <label className="grid gap-2 text-sm text-muted">
              <span className="pl-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
                Предпочтения и ограничения питания
              </span>
              <textarea
                className={`${inputClassName} min-h-28 resize-y`}
                onChange={(event) => setDietaryPreferences(event.target.value)}
                placeholder="Например: высокий белок, без лактозы, меньше сахара, без свинины"
                value={dietaryPreferences}
              />
            </label>
          </div>
        </SectionShell>

        {error ? (
          <p className="rounded-[1rem] border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p className="rounded-[1rem] border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-[linear-gradient(180deg,rgba(248,251,255,0),rgba(248,251,255,0.94)_24%,rgba(248,251,255,1)_100%)] px-4 pb-[calc(1.1rem+env(safe-area-inset-bottom))] pt-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-[780px] flex-col gap-3 rounded-[1.1rem] border border-border bg-white/94 px-4 py-3 shadow-[0_28px_54px_-40px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="workspace-kicker">Готовность профиля</p>
            <p className="mt-1 break-words text-sm font-bold text-foreground">
              {canSubmit
                ? "Можно запускать fitora"
                : "Заполни обязательные поля"}
            </p>
          </div>

          <button
            className="inline-flex w-full items-center justify-center rounded-[0.95rem] bg-[linear-gradient(135deg,#2563EB,#0891FF,#2DD4BF)] px-4 py-3 text-center text-sm font-extrabold text-white shadow-[0_20px_42px_-26px_rgba(8,145,255,0.52)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[14rem]"
            disabled={isPending || !canSubmit}
            onClick={submit}
            type="button"
          >
            {isPending ? "Сохраняю..." : "Сохранить и продолжить"}
          </button>
        </div>
      </div>
    </div>
  );
}
