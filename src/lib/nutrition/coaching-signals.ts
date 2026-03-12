export type NutritionCoachingSignalStatus = "positive" | "watch" | "attention";

export type NutritionCoachingSignalKey =
  | "logging"
  | "calories"
  | "protein"
  | "bodyweight";

export type NutritionCoachingSignal = {
  key: NutritionCoachingSignalKey;
  status: NutritionCoachingSignalStatus;
  title: string;
  metric: string;
  summary: string;
  action: string;
};

type BuildNutritionCoachingSignalsInput = {
  trackedDays: number;
  targetAlignedDays: number;
  avgKcalDelta: number | null;
  avgProteinDelta: number | null;
  latestWeightKg: number | null;
  previousWeightKg: number | null;
  deltaKg: number | null;
  goalType?: string | null;
  targetWeightKg?: number | null;
};

function formatNumber(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

function formatSigned(value: number | null, suffix: string) {
  if (value === null) {
    return "нет данных";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatNumber(value)} ${suffix}`;
}

function buildLoggingSignal(
  input: BuildNutritionCoachingSignalsInput,
): NutritionCoachingSignal {
  if (input.trackedDays >= 6) {
    return {
      key: "logging",
      status: "positive",
      title: "Питание логируется стабильно",
      metric: `${input.trackedDays}/7 дней`,
      summary:
        "История питания уже достаточно плотная, чтобы AI видел реальный режим, а не отдельные случайные дни.",
      action:
        "Сохраняй такой же ритм логов. На этой базе можно точнее корректировать калории и распределение макросов.",
    };
  }

  if (input.trackedDays >= 4) {
    return {
      key: "logging",
      status: "watch",
      title: "История питания уже полезна, но ещё рваная",
      metric: `${input.trackedDays}/7 дней`,
      summary:
        "Логов уже хватает для ориентиров, но пропуски всё ещё скрывают реальные отклонения по рациону.",
      action:
        "Добейся хотя бы 6 дней с логом из 7, чтобы рекомендации по питанию и восстановлению стали заметно точнее.",
    };
  }

  return {
    key: "logging",
    status: "attention",
    title: "Логов питания пока недостаточно",
    metric: `${input.trackedDays}/7 дней`,
    summary:
      "Пока история слишком редкая, чтобы уверенно судить о калорийности и белке. Любые рекомендации будут опираться на неполную картину.",
    action:
      "Начни с простого: фиксируй хотя бы основные приёмы пищи несколько дней подряд, не пытаясь сразу довести лог до идеала.",
  };
}

function buildCaloriesSignal(
  input: BuildNutritionCoachingSignalsInput,
): NutritionCoachingSignal {
  if (input.avgKcalDelta === null) {
    return {
      key: "calories",
      status: "watch",
      title: "Цель по калориям не задана",
      metric: "нет целевой калорийности",
      summary:
        "Система видит фактическое питание, но без целевой калорийности не может оценить, насколько рацион совпадает с задачей.",
      action:
        "Задай целевую калорийность в профиле питания, чтобы AI мог отличать норму от системного отклонения.",
    };
  }

  const absDelta = Math.abs(input.avgKcalDelta);

  if (absDelta <= 150) {
    return {
      key: "calories",
      status: "positive",
      title: "Калорийность близка к цели",
      metric: formatSigned(input.avgKcalDelta, "ккал"),
      summary:
        "Средняя калорийность держится рядом с целевым уровнем, без явного системного ухода в плюс или минус.",
      action:
        "Можно корректировать рацион точечно: менять состав блюд и белок, не ломая весь объём калорий.",
    };
  }

  if (absDelta <= 300) {
    return {
      key: "calories",
      status: "watch",
      title: "Калорийность слегка уходит от цели",
      metric: formatSigned(input.avgKcalDelta, "ккал"),
      summary:
        "Отклонение уже заметно, но пока выглядит управляемым. Такое смещение обычно решается парой стабильных привычек, а не полной перестройкой меню.",
      action:
        "Сдвинь один повторяющийся приём пищи или перекус, чтобы вернуть среднюю калорийность ближе к цели.",
    };
  }

  return {
    key: "calories",
    status: "attention",
    title: "Калорийность системно расходится с целью",
    metric: formatSigned(input.avgKcalDelta, "ккал"),
    summary:
      "Средняя калорийность уже слишком далеко от цели, и это начинает мешать устойчивому результату по массе тела и восстановлению.",
    action:
      "Не правь рацион хаотично. Сначала убери или добавь один крупный повторяющийся источник калорий и оцени эффект 5-7 дней.",
  };
}

function buildProteinSignal(
  input: BuildNutritionCoachingSignalsInput,
): NutritionCoachingSignal {
  if (input.avgProteinDelta === null) {
    return {
      key: "protein",
      status: "watch",
      title: "Цель по белку не задана",
      metric: "нет белковой цели",
      summary:
        "Без цели по белку сложнее судить, хватает ли питания для восстановления, удержания формы и роста нагрузки.",
      action:
        "Задай цель по белку в профиле питания, чтобы AI мог оценивать рацион не только по калориям, но и по качеству восстановления.",
    };
  }

  if (input.avgProteinDelta >= -10) {
    return {
      key: "protein",
      status: "positive",
      title: "Белок держится на рабочем уровне",
      metric: formatSigned(input.avgProteinDelta, "г"),
      summary:
        "Белок находится достаточно близко к целевому уровню, поэтому рацион лучше поддерживает восстановление и адаптацию к тренировкам.",
      action:
        "Сохраняй текущую структуру белковых приёмов пищи и не снижай её в дни, где тренировки становятся тяжелее.",
    };
  }

  if (input.avgProteinDelta >= -25) {
    return {
      key: "protein",
      status: "watch",
      title: "Белок немного недобирается",
      metric: formatSigned(input.avgProteinDelta, "г"),
      summary:
        "Небольшой недобор уже заметен и со временем может ухудшать восстановление, особенно если силовая нагрузка растёт.",
      action:
        "Добавь один стабильный белковый источник в день вместо попытки добирать белок случайно и нерегулярно.",
    };
  }

  return {
    key: "protein",
    status: "attention",
    title: "Белка системно не хватает",
    metric: formatSigned(input.avgProteinDelta, "г"),
    summary:
      "Средний недобор белка уже слишком велик. На таком фоне тренировочная прогрессия и восстановление будут страдать даже при нормальных калориях.",
    action:
      "Сначала выровняй белок до цели, а уже потом правь остальную структуру рациона. Это даст самый быстрый эффект по восстановлению.",
  };
}

function buildBodyweightSignal(
  input: BuildNutritionCoachingSignalsInput,
): NutritionCoachingSignal {
  if (input.latestWeightKg === null) {
    return {
      key: "bodyweight",
      status: "watch",
      title: "Нет свежего веса тела",
      metric: "без замеров",
      summary:
        "Без свежих замеров веса тела сложнее понять, как питание отражается на фактической динамике формы.",
      action:
        "Добавляй хотя бы один стабильный замер веса тела в неделю, чтобы видеть, как рацион влияет на результат.",
    };
  }

  if (input.deltaKg === null) {
    return {
      key: "bodyweight",
      status: "watch",
      title: "Есть только один свежий замер веса",
      metric: `${formatNumber(input.latestWeightKg)} кг`,
      summary:
        "Последний вес уже зафиксирован, но пока нет второго ориентира, чтобы оценить направление движения.",
      action:
        "Сделай ещё один замер в сопоставимых условиях, чтобы связать рацион с реальной динамикой веса тела.",
    };
  }

  if (input.goalType === "fat_loss") {
    if (input.deltaKg <= -0.2) {
      return {
        key: "bodyweight",
        status: "positive",
        title: "Вес тела движется в сторону снижения",
        metric: formatSigned(input.deltaKg, "кг"),
        summary:
          "Свежая динамика веса тела совпадает с задачей снижения веса и подтверждает, что рацион в целом работает в нужную сторону.",
        action:
          "Сохраняй текущий режим ещё несколько замеров подряд и избегай резких урезаний калорий, если прогресс уже идёт.",
      };
    }

    if (input.deltaKg >= 0.3) {
      return {
        key: "bodyweight",
        status: "attention",
        title: "Вес тела идёт против цели снижения",
        metric: formatSigned(input.deltaKg, "кг"),
        summary:
          "Свежий тренд по весу тела не совпадает с целью снижения. Это может означать системный избыток калорий или слишком редкие и шумные логи.",
        action:
          "Сначала проверь стабильность логов и повторяющиеся калорийные места в рационе, а уже потом урезай калорийность.",
      };
    }
  }

  if (input.goalType === "muscle_gain") {
    if (input.deltaKg >= 0.1) {
      return {
        key: "bodyweight",
        status: "positive",
        title: "Вес тела поддерживает набор",
        metric: formatSigned(input.deltaKg, "кг"),
        summary:
          "Свежая динамика веса тела выглядит совместимой с задачей набора и подтверждает, что питания хватает для движения вверх.",
        action:
          "Сохраняй калорийность и белок стабильными, а прибавку делай маленькими шагами, если силовой прогресс требует ещё ресурса.",
      };
    }

    if (input.deltaKg <= -0.2) {
      return {
        key: "bodyweight",
        status: "attention",
        title: "Вес тела не поддерживает набор",
        metric: formatSigned(input.deltaKg, "кг"),
        summary:
          "Свежая динамика веса идёт вниз или стоит слишком низко для цели набора. Это часто означает, что калорийности или регулярности питания не хватает.",
        action:
          "Усиль один повторяющийся приём пищи и проверь, как изменится средняя калорийность и вес тела через неделю.",
      };
    }
  }

  if (input.goalType === "maintenance") {
    if (Math.abs(input.deltaKg) <= 0.5) {
      return {
        key: "bodyweight",
        status: "positive",
        title: "Вес тела держится стабильно",
        metric: formatSigned(input.deltaKg, "кг"),
        summary:
          "Свежий вес тела остаётся в спокойном диапазоне и не показывает сильного ухода от поддерживающего режима.",
        action:
          "Можно работать через небольшие изменения качества рациона, не трогая сильно общую калорийность.",
      };
    }
  }

  return {
    key: "bodyweight",
    status: "watch",
    title: "Вес тела меняется, но сигнал пока нейтральный",
    metric: formatSigned(input.deltaKg, "кг"),
    summary:
      "Свежая динамика веса уже видна, но сама по себе ещё не говорит о проблеме. Её нужно читать вместе с калорийностью и регулярностью логов.",
    action:
      "Смотри не на один замер, а на серию из нескольких недель, и оценивай вес вместе с калориями, белком и тренировочной нагрузкой.",
  };
}

export function buildNutritionCoachingSignals(
  input: BuildNutritionCoachingSignalsInput,
): NutritionCoachingSignal[] {
  return [
    buildLoggingSignal(input),
    buildCaloriesSignal(input),
    buildProteinSignal(input),
    buildBodyweightSignal(input),
  ];
}

export function formatNutritionCoachingSignalsForPrompt(
  signals: NutritionCoachingSignal[],
) {
  if (!signals.length) {
    return "Пищевые коуч-сигналы пока не сформированы.";
  }

  return signals
    .map(
      (signal, index) =>
        `${index + 1}. ${signal.title} [${signal.metric}] — ${signal.summary} Следующий шаг: ${signal.action}`,
    )
    .join("\n");
}
