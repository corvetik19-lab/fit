"use client";

import { CheckCircle2, Dumbbell, Flame, HeartPulse, Utensils } from "lucide-react";
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
  "w-full rounded-[1.2rem] border-none bg-[#f1edec] px-4 py-4 text-sm text-foreground outline-none transition placeholder:text-[#8d8a8f] focus:bg-white focus:ring-2 focus:ring-accent/18";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function SectionShell({
  index,
  title,
  children,
}: {
  children: React.ReactNode;
  index: string;
  title: string;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="font-display text-4xl font-black tracking-[-0.08em] text-[#d8d4d3]">
          {index}
        </span>
        <h2 className="font-display text-lg font-bold uppercase tracking-[0.06em] text-foreground">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function InsightCard({
  icon: Icon,
  title,
  detail,
}: {
  detail: string;
  icon: typeof Dumbbell;
  title: string;
}) {
  return (
    <div className="rounded-[1.35rem] bg-[#f1edec] p-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-accent shadow-[0_16px_30px_-22px_rgba(0,64,224,0.24)]">
          <Icon size={18} strokeWidth={2.1} />
        </span>
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.06em] text-foreground">
            {title}
          </p>
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

    return `${weeklyTrainingDays.trim()} трен./неделю`;
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

        setNotice("Профиль сохранён. Переходим в рабочее пространство.");
        router.replace("/dashboard");
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <div className="relative">
      <div className="space-y-10 pb-24">
        <div className="rounded-[2rem] bg-[#f6f3f2] p-6 shadow-[0_30px_60px_-46px_rgba(28,27,27,0.18)] sm:p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <InsightCard
              detail="Точка входа для персонального плана и AI-контекста."
              icon={CheckCircle2}
              title="Профиль"
            />
            <InsightCard
              detail="Частота, уровень и цель помогут точно собрать нагрузку."
              icon={Dumbbell}
              title="Режим"
            />
            <InsightCard
              detail={`Текущий аккаунт: ${userEmail}`}
              icon={HeartPulse}
              title="Сессия"
            />
          </div>
        </div>

        <SectionShell index="01" title="Биометрия">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-muted sm:col-span-2">
              <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
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
              <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
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
              <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
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
              <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
                Рост (см)
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
              <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
                Вес (кг)
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
              <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
                Целевой вес (кг)
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

        <SectionShell index="02" title="Тренировочный интеллект">
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-muted">
                <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
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
                  <option value="advanced">Профи</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-muted">
                <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
                  Цель
                </span>
                <select
                  className={inputClassName}
                  onChange={(event) => setGoalType(event.target.value as GoalType)}
                  value={goalType}
                >
                  <option value="fat_loss">Снижение веса</option>
                  <option value="maintenance">Поддержание формы</option>
                  <option value="muscle_gain">Набор мышц</option>
                  <option value="performance">Выносливость и результат</option>
                </select>
              </label>
            </div>

            <div className="rounded-[1.5rem] bg-[#f6f3f2] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
                    Частота в неделю
                  </p>
                  <p className="mt-2 font-display text-xl font-bold tracking-[-0.05em] text-foreground">
                    Рабочий ритм
                  </p>
                </div>
                <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-soft)_58%,white)] px-3 py-2 text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-accent">
                  {readinessLabel}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3 text-center">
                {["3x", "4x", "5x", "6x"].map((item) => {
                  const isActive = weeklyTrainingDays === item.replace("x", "");
                  return (
                    <div
                      className={`rounded-[1rem] px-3 py-4 font-display text-lg font-bold tracking-[-0.04em] ${
                        isActive
                          ? "bg-[linear-gradient(135deg,#0040e0,#2e5bff)] text-white shadow-[0_18px_36px_-24px_rgba(0,64,224,0.45)]"
                          : "bg-[#ebe7e7] text-foreground"
                      }`}
                      key={item}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>

              <label className="mt-4 grid gap-2 text-sm text-muted">
                <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
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

        <SectionShell index="03" title="Ограничения">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm text-muted">
              <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
                Доступное оборудование
              </span>
              <textarea
                className={`${inputClassName} min-h-28 resize-y`}
                onChange={(event) => setEquipment(event.target.value)}
                placeholder="Например: штанга, стойка, скамья, гантели, турник"
                value={equipment}
              />
            </label>

            <label className="grid gap-2 text-sm text-muted">
              <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
                Ограничения или травмы
              </span>
              <textarea
                className={`${inputClassName} min-h-24 resize-y`}
                onChange={(event) => setInjuries(event.target.value)}
                placeholder="Через запятую, если есть особые ограничения"
                value={injuries}
              />
            </label>
          </div>
        </SectionShell>

        <SectionShell index="04" title="Философия питания">
          <div className="grid gap-4">
            <div className="grid gap-3">
              <div className="rounded-[1.4rem] border border-accent/20 bg-white p-4 shadow-[0_20px_40px_-30px_rgba(0,64,224,0.25)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent-soft)_64%,white)] text-accent">
                      <Utensils size={18} strokeWidth={2.1} />
                    </span>
                    <div>
                      <p className="font-display text-sm font-bold uppercase tracking-[0.06em] text-foreground">
                        Питание по профилю
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Любые важные ограничения, предпочтения и стиль рациона.
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="text-accent" size={20} strokeWidth={2.1} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] bg-[#f1edec] p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-accent">
                      <Flame size={18} strokeWidth={2.1} />
                    </span>
                    <div>
                      <p className="font-display text-sm font-bold uppercase tracking-[0.06em] text-foreground">
                        High protein
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Подходит, если задача — восстанавливаться и удерживать форму.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.25rem] bg-[#f1edec] p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-accent">
                      <HeartPulse size={18} strokeWidth={2.1} />
                    </span>
                    <div>
                      <p className="font-display text-sm font-bold uppercase tracking-[0.06em] text-foreground">
                        Без перегруза
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Мы учитываем ограничения и бережный режим восстановления.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <label className="grid gap-2 text-sm text-muted">
              <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
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
          <p className="rounded-[1.2rem] border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p className="rounded-[1.2rem] border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-[linear-gradient(180deg,rgba(252,249,248,0),rgba(252,249,248,0.94)_24%,rgba(252,249,248,1)_100%)] px-5 pb-[calc(1.1rem+env(safe-area-inset-bottom))] pt-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-[780px] items-center justify-between gap-4 rounded-[1.5rem] bg-white/90 px-4 py-3 shadow-[0_28px_54px_-40px_rgba(28,27,27,0.22)] backdrop-blur-xl">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#75747d]">
              Готовность профиля
            </p>
            <p className="mt-1 font-display text-sm font-bold uppercase tracking-[0.06em] text-foreground">
              {canSubmit ? "Можно запускать fit" : "Заполни обязательные поля"}
            </p>
          </div>

          <button
            className="inline-flex min-w-[15rem] items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#0040e0,#2e5bff)] px-5 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_20px_42px_-26px_rgba(0,64,224,0.52)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_46px_-24px_rgba(0,64,224,0.58)] disabled:cursor-not-allowed disabled:opacity-60"
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
