export type WorkoutCoachingSignalStatus = "positive" | "watch" | "attention";

export type WorkoutCoachingSignalKey =
  | "progression"
  | "recovery"
  | "consistency"
  | "focus";

export type WorkoutCoachingSignal = {
  key: WorkoutCoachingSignalKey;
  status: WorkoutCoachingSignalStatus;
  title: string;
  metric: string;
  summary: string;
  action: string;
};

export type WorkoutCoachingFocusExercise = {
  exerciseTitle: string;
  momentum: "up" | "stable" | "down";
  tonnageDeltaKg: number;
  weightDeltaKg: number | null;
  recentCompletedSets: number;
  previousCompletedSets: number;
};

type BuildWorkoutCoachingSignalsInput = {
  recentCompletedDays: number;
  recentCompletedSets: number;
  previousCompletedSets: number;
  recentTonnageKg: number;
  previousTonnageKg: number;
  recentAvgActualWeightKg: number | null;
  previousAvgActualWeightKg: number | null;
  avgActualRpeRecent: number | null;
  hardSetShareRecent: number | null;
  avgRestSecondsRecent: number | null;
  notedSetsRecent: number;
  daysSinceLastWorkout: number | null;
  consistencyRatio: number | null;
  goalDaysPerWeek: number | null;
  focusExercise?: WorkoutCoachingFocusExercise | null;
};

function roundToSingleDecimal(value: number) {
  return Number(value.toFixed(1));
}

function formatDecimal(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

function formatKg(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return `${formatDecimal(value)} кг`;
}

function formatSignedKg(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatKg(roundToSingleDecimal(value))}`;
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return `${Math.round(value * 100)}%`;
}

function formatSignedPercent(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  const percent = Math.round(value * 100);
  const prefix = percent > 0 ? "+" : "";
  return `${prefix}${percent}%`;
}

function formatDays(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return `${value} дн.`;
}

function formatSeconds(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return `${Math.round(value)} сек`;
}

function buildProgressionSignal(
  input: BuildWorkoutCoachingSignalsInput,
): WorkoutCoachingSignal {
  if (input.recentCompletedSets === 0) {
    return {
      key: "progression",
      status: "attention",
      title: "Нет базы для прогрессии",
      metric: "0 рабочих сетов",
      summary:
        "За последнее окно нет сохраненных рабочих подходов, поэтому система пока не может оценить рост нагрузки.",
      action:
        "Сохраняй повторы и вес хотя бы в ключевых упражнениях каждой тренировки, чтобы AI видел реальную динамику.",
    };
  }

  const tonnageDeltaKg = input.recentTonnageKg - input.previousTonnageKg;
  const tonnageDeltaRatio =
    input.previousTonnageKg > 0 ? tonnageDeltaKg / input.previousTonnageKg : null;
  const weightDeltaKg =
    input.recentAvgActualWeightKg !== null && input.previousAvgActualWeightKg !== null
      ? roundToSingleDecimal(
          input.recentAvgActualWeightKg - input.previousAvgActualWeightKg,
        )
      : null;

  if (input.previousCompletedSets === 0 || input.previousTonnageKg === 0) {
    return {
      key: "progression",
      status: "positive",
      title: "Формируется новая база нагрузки",
      metric: `${formatKg(input.recentTonnageKg)} за окно`,
      summary:
        "История уже стала достаточно плотной, чтобы строить прогрессию по реальным весам, а не только по повторам.",
      action:
        "Держи тот же ритм еще 1-2 недели и постепенно повышай вес в базовых упражнениях, где техника стабильна.",
    };
  }

  if (
    tonnageDeltaRatio !== null &&
    tonnageDeltaRatio >= 0.08 &&
    (input.avgActualRpeRecent === null || input.avgActualRpeRecent <= 8.7)
  ) {
    return {
      key: "progression",
      status: "positive",
      title: "Нагрузка растет управляемо",
      metric: `${formatSignedPercent(tonnageDeltaRatio)} по тоннажу`,
      summary: `За текущее окно тоннаж вырос на ${formatSignedPercent(
        tonnageDeltaRatio,
      )}, а рабочее усилие остаётся управляемым. ${
        weightDeltaKg !== null
          ? `Средний рабочий вес тоже изменился на ${formatSignedKg(weightDeltaKg)}.`
          : ""
      }`.trim(),
      action:
        "Можно продолжать плавную прогрессию: повышай вес точечно на 2.5-5% в упражнениях, где RPE не уходит слишком высоко.",
    };
  }

  if (
    tonnageDeltaRatio !== null &&
    tonnageDeltaRatio > 0.15 &&
    input.avgActualRpeRecent !== null &&
    input.avgActualRpeRecent >= 8.8
  ) {
    return {
      key: "progression",
      status: "attention",
      title: "Нагрузка растет слишком резко",
      metric: `${formatSignedPercent(tonnageDeltaRatio)} по тоннажу`,
      summary: `Общий объём вырос на ${formatSignedPercent(
        tonnageDeltaRatio,
      )}, но средний RPE уже держится около ${formatDecimal(
        input.avgActualRpeRecent,
      )}. Это похоже на агрессивный скачок нагрузки.`,
      action:
        "Не добавляй одновременно и вес, и объём. На ближайшей неделе сократи прибавку и оставь запас по усилию.",
    };
  }

  if (tonnageDeltaRatio !== null && tonnageDeltaRatio <= -0.12) {
    return {
      key: "progression",
      status: "attention",
      title: "Объём просел относительно прошлого окна",
      metric: `${formatSignedPercent(tonnageDeltaRatio)} по тоннажу`,
      summary: `Тоннаж снизился на ${formatSignedPercent(
        tonnageDeltaRatio,
      )} относительно предыдущих недель. Это может быть разгрузка, но может быть и просадка ритма.`,
      action:
        "Проверь сон, питание и последние заметки к подходам. Если это не запланированная разгрузка, возвращай объём постепенно.",
    };
  }

  return {
    key: "progression",
    status: "watch",
    title: "Нагрузка пока идет ровно",
    metric: `${formatSignedKg(tonnageDeltaKg)} по тоннажу`,
    summary:
      "По сравнению с прошлым окном нет явного прорыва или провала. Это нормальный участок, где прогресс часто прячется в технике и качестве сетов.",
    action:
      "Сохраняй текущий объём и поднимай вес только в тех упражнениях, где повторы и RPE остаются под контролем.",
  };
}

function buildRecoverySignal(
  input: BuildWorkoutCoachingSignalsInput,
): WorkoutCoachingSignal {
  if (input.recentCompletedSets === 0) {
    return {
      key: "recovery",
      status: "watch",
      title: "Недостаточно данных о восстановлении",
      metric: "нет рабочих сетов",
      summary:
        "Сигнал по восстановлению станет точнее после того, как появятся рабочие сеты с весом, RPE и отдыхом.",
      action:
        "Логируй RPE и отдых хотя бы в основных упражнениях, чтобы AI видел, как ты переносишь нагрузку.",
    };
  }

  const highRpe =
    input.avgActualRpeRecent !== null && input.avgActualRpeRecent >= 8.7;
  const hardShareHigh =
    input.hardSetShareRecent !== null && input.hardSetShareRecent >= 0.4;
  const longRest =
    input.avgRestSecondsRecent !== null && input.avgRestSecondsRecent >= 180;
  const noteHint =
    input.notedSetsRecent > 0
      ? ` В заметках уже отмечено ${input.notedSetsRecent} подходов с дополнительным контекстом.`
      : "";

  if (highRpe && hardShareHigh) {
    return {
      key: "recovery",
      status: "attention",
      title: "Восстановление под давлением",
      metric: `RPE ${formatDecimal(input.avgActualRpeRecent)} • тяжёлые ${formatPercent(
        input.hardSetShareRecent,
      )}`,
      summary: `Средний RPE уже высокий, а доля тяжёлых сетов держится на ${formatPercent(
        input.hardSetShareRecent,
      )}. ${longRest ? `Средний отдых около ${formatSeconds(input.avgRestSecondsRecent)} тоже намекает на тяжёлый блок.` : ""}${noteHint}`.trim(),
      action:
        "На следующем микроцикле сократи самые тяжёлые сеты или оставь вес без повышения, пока самочувствие и техника не стабилизируются.",
    };
  }

  if (
    highRpe ||
    hardShareHigh ||
    (input.avgActualRpeRecent !== null && input.avgActualRpeRecent >= 8.2) ||
    longRest
  ) {
    return {
      key: "recovery",
      status: "watch",
      title: "Нагрузка уже ощутимая",
      metric: `${formatSeconds(input.avgRestSecondsRecent)} отдыха • RPE ${formatDecimal(
        input.avgActualRpeRecent,
      )}`,
      summary: `Интенсивность уже не выглядит лёгкой: средний RPE ${formatDecimal(
        input.avgActualRpeRecent,
      )}, отдых между сетами около ${formatSeconds(
        input.avgRestSecondsRecent,
      )}.${noteHint}`,
      action:
        "Не повышай все упражнения сразу. Следи за заметками к подходам и держи 1-2 упражнения в роли якоря прогрессии, а не весь план целиком.",
    };
  }

  return {
    key: "recovery",
    status: "positive",
    title: "Восстановление выглядит управляемым",
    metric: `RPE ${formatDecimal(input.avgActualRpeRecent)} • отдых ${formatSeconds(
      input.avgRestSecondsRecent,
    )}`,
    summary:
      "По рабочему усилию и паузам между сетами текущая нагрузка выглядит контролируемой, без явного сигнала перегруза.",
    action:
      "Можно оставлять текущую частоту и добавлять прогрессию постепенно, если качество выполнения остаётся ровным.",
  };
}

function buildConsistencySignal(
  input: BuildWorkoutCoachingSignalsInput,
): WorkoutCoachingSignal {
  if (!input.goalDaysPerWeek || input.goalDaysPerWeek <= 0) {
    return {
      key: "consistency",
      status: "watch",
      title: "Цель по ритму не задана",
      metric: `${input.recentCompletedDays} тренировок в окне`,
      summary:
        "Система видит фактический ритм, но без целевого числа тренировок в неделю сложнее оценить дисциплину относительно плана.",
      action:
        "Задай целевое число тренировочных дней в целях, чтобы рекомендации по регулярности стали точнее.",
    };
  }

  if (
    input.consistencyRatio !== null &&
    input.consistencyRatio >= 0.9 &&
    (input.daysSinceLastWorkout === null || input.daysSinceLastWorkout <= 3)
  ) {
    return {
      key: "consistency",
      status: "positive",
      title: "Ритм держится близко к цели",
      metric: `${formatPercent(input.consistencyRatio)} к цели`,
      summary: `За последнее окно ты удерживаешь ${formatPercent(
        input.consistencyRatio,
      )} от целевого ритма ${input.goalDaysPerWeek} тренировки в неделю.`,
      action:
        "Оставляй текущие слоты под тренировки фиксированными и поднимай нагрузку только поверх стабильного графика.",
    };
  }

  if (input.consistencyRatio !== null && input.consistencyRatio >= 0.6) {
    return {
      key: "consistency",
      status: "watch",
      title: "Ритм умеренный, но не идеальный",
      metric: `${formatPercent(input.consistencyRatio)} к цели`,
      summary: `Фактическая частота уже рабочая, но пока не дотягивает до цели ${input.goalDaysPerWeek} тренировки в неделю.${
        input.daysSinceLastWorkout !== null
          ? ` После последней сессии прошло ${formatDays(input.daysSinceLastWorkout)}.`
          : ""
      }`,
      action:
        "Сначала выровняй регулярность, а уже потом повышай объём. Стабильный график даст больше роста, чем случайные тяжёлые сессии.",
    };
  }

  return {
    key: "consistency",
    status: "attention",
    title: "Ритм просел относительно цели",
    metric:
      input.consistencyRatio !== null
        ? `${formatPercent(input.consistencyRatio)} к цели`
        : `${input.recentCompletedDays} тренировок`,
    summary: `Фактический ритм пока слишком далёк от целевого ${input.goalDaysPerWeek} тренировки в неделю.${
      input.daysSinceLastWorkout !== null
        ? ` После последней сессии прошло ${formatDays(input.daysSinceLastWorkout)}.`
        : ""
    }`,
    action:
      "Не форсируй вес и тоннаж. Сначала верни предсказуемый ритм 2-3 недели подряд, чтобы нагрузка снова стала устойчивой.",
  };
}

function buildFocusSignal(
  input: BuildWorkoutCoachingSignalsInput,
): WorkoutCoachingSignal {
  if (!input.focusExercise) {
    return {
      key: "focus",
      status: "watch",
      title: "Ключевое упражнение пока не выделилось",
      metric: "нужно больше истории",
      summary:
        "Для точечного сигнала по упражнению пока не хватает плотной истории с весами и рабочими сетами.",
      action:
        "Сохраняй вес и заметки хотя бы в базовых упражнениях, чтобы AI видел, где именно растёт или проседает сила.",
    };
  }

  const focus = input.focusExercise;
  const deltaMetric =
    focus.weightDeltaKg !== null
      ? `вес ${formatSignedKg(focus.weightDeltaKg)}`
      : `тоннаж ${formatSignedKg(focus.tonnageDeltaKg)}`;

  if (focus.momentum === "down") {
    return {
      key: "focus",
      status: "attention",
      title: `Нужно проверить упражнение: ${focus.exerciseTitle}`,
      metric: deltaMetric,
      summary: `${focus.exerciseTitle} выглядит как точка просадки: текущий блок уступает предыдущему по объёму или качеству нагрузки.`,
      action:
        "Не повышай нагрузку в этом упражнении до выяснения причины. Проверь технику, восстановление и заметки к последним сетам.",
    };
  }

  if (focus.momentum === "up") {
    return {
      key: "focus",
      status: "positive",
      title: `Лучше всего растёт: ${focus.exerciseTitle}`,
      metric: deltaMetric,
      summary: `${focus.exerciseTitle} сейчас даёт лучший прогресс по нагрузке и может быть якорем текущего блока.`,
      action:
        "Оставь это упражнение точкой основной прогрессии, а остальной объём повышай более консервативно.",
    };
  }

  return {
    key: "focus",
    status: "watch",
    title: `Ровная динамика: ${focus.exerciseTitle}`,
    metric: deltaMetric,
    summary: `${focus.exerciseTitle} идёт стабильно, но без явного рывка. Это хороший кандидат для аккуратной микропрогрессии.`,
    action:
      "Попробуй минимальную прибавку веса или повторов и проверь, останется ли техника такой же чистой.",
  };
}

export function buildWorkoutCoachingSignals(
  input: BuildWorkoutCoachingSignalsInput,
): WorkoutCoachingSignal[] {
  return [
    buildProgressionSignal(input),
    buildRecoverySignal(input),
    buildConsistencySignal(input),
    buildFocusSignal(input),
  ];
}

export function formatWorkoutCoachingSignalsForPrompt(
  signals: WorkoutCoachingSignal[],
) {
  if (!signals.length) {
    return "Коуч-сигналы пока не сформированы.";
  }

  return signals
    .map(
      (signal, index) =>
        `${index + 1}. ${signal.title} [${signal.metric}] — ${signal.summary} Следующий шаг: ${signal.action}`,
    )
    .join("\n");
}
