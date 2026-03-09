export const repRangePresets = [
  { key: "1-6", label: "1-6 повторов", min: 1, max: 6 },
  { key: "6-10", label: "6-10 повторов", min: 6, max: 10 },
  { key: "6-12", label: "6-12 повторов", min: 6, max: 12 },
  { key: "10-15", label: "10-15 повторов", min: 10, max: 15 },
  { key: "15-20", label: "15-20 повторов", min: 15, max: 20 },
  { key: "20-25", label: "20-25 повторов", min: 20, max: 25 },
] as const;

export type RepRangePreset = (typeof repRangePresets)[number];
export type RepRangePresetKey = RepRangePreset["key"];

export type PlannedRepRangeLike = {
  planned_reps: number;
  planned_reps_min?: number | null;
  planned_reps_max?: number | null;
};

export type TemplateRepRangeLike = {
  repRangeKey?: string | null;
  plannedReps?: number | null;
  plannedRepsMin?: number | null;
  plannedRepsMax?: number | null;
};

export const defaultRepRangePresetKey: RepRangePresetKey = "6-10";

const repRangePresetMap = new Map<string, RepRangePreset>(
  repRangePresets.map((preset) => [preset.key, preset]),
);

export function isRepRangePresetKey(value: string): value is RepRangePresetKey {
  return repRangePresetMap.has(value);
}

export function getRepRangePreset(
  key: string | null | undefined,
): RepRangePreset | null {
  if (!key || !isRepRangePresetKey(key)) {
    return null;
  }

  return repRangePresetMap.get(key) ?? null;
}

export function getRepRangeValues(min: number, max: number) {
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

export function formatRepRange(min: number, max: number) {
  return min === max ? `${min}` : `${min}-${max}`;
}

export function getSetRepRange(source: PlannedRepRangeLike) {
  if (
    source.planned_reps_min == null ||
    source.planned_reps_max == null ||
    source.planned_reps_min <= 0 ||
    source.planned_reps_max < source.planned_reps_min
  ) {
    return null;
  }

  return {
    min: source.planned_reps_min,
    max: source.planned_reps_max,
  };
}

export function formatPlannedRepTarget(source: PlannedRepRangeLike) {
  const bounds = getSetRepRange(source);

  if (!bounds) {
    return `${source.planned_reps}`;
  }

  return formatRepRange(bounds.min, bounds.max);
}

export function getActualRepOptions(source: PlannedRepRangeLike) {
  const bounds = getSetRepRange(source);

  if (!bounds) {
    return getRepRangeValues(1, 25);
  }

  return getRepRangeValues(bounds.min, bounds.max);
}

function findPresetByBounds(min: number, max: number) {
  return (
    repRangePresets.find((preset) => preset.min === min && preset.max === max) ??
    null
  );
}

function findCoveringPreset(min: number, max: number) {
  const matchingPresets = repRangePresets.filter(
    (preset) => min >= preset.min && max <= preset.max,
  );

  if (!matchingPresets.length) {
    return null;
  }

  return matchingPresets.sort((left, right) => {
    const leftSpan = left.max - left.min;
    const rightSpan = right.max - right.min;

    if (leftSpan !== rightSpan) {
      return leftSpan - rightSpan;
    }

    return left.min - right.min;
  })[0];
}

function findPresetByValue(value: number) {
  return repRangePresets.find((preset) => value >= preset.min && value <= preset.max);
}

export function resolveRepRangePreset(
  value: TemplateRepRangeLike | string | null | undefined,
) {
  if (typeof value === "string") {
    return getRepRangePreset(value) ?? getRepRangePreset(defaultRepRangePresetKey)!;
  }

  const directPreset = getRepRangePreset(value?.repRangeKey);

  if (directPreset) {
    return directPreset;
  }

  if (
    typeof value?.plannedRepsMin === "number" &&
    typeof value?.plannedRepsMax === "number"
  ) {
    return (
      findPresetByBounds(value.plannedRepsMin, value.plannedRepsMax) ??
      findCoveringPreset(value.plannedRepsMin, value.plannedRepsMax) ??
      getRepRangePreset(defaultRepRangePresetKey)!
    );
  }

  if (typeof value?.plannedReps === "number") {
    return (
      findPresetByValue(value.plannedReps) ??
      getRepRangePreset(defaultRepRangePresetKey)!
    );
  }

  return getRepRangePreset(defaultRepRangePresetKey)!;
}

export function resolveRepRangePresetFromText(rawValue: string) {
  const matches = rawValue.match(/\d+/g) ?? [];
  const numbers = matches
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (numbers.length >= 2) {
    const min = Math.min(numbers[0], numbers[1]);
    const max = Math.max(numbers[0], numbers[1]);

    return (
      findPresetByBounds(min, max) ??
      findCoveringPreset(min, max) ??
      findPresetByValue(max) ??
      getRepRangePreset(defaultRepRangePresetKey)!
    );
  }

  if (numbers.length === 1) {
    return (
      findPresetByValue(numbers[0]) ??
      getRepRangePreset(defaultRepRangePresetKey)!
    );
  }

  return getRepRangePreset(defaultRepRangePresetKey)!;
}
