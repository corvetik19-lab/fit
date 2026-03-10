import type { UserDataExportBundle } from "@/lib/settings-data-server";

type ExportArchiveFile = {
  name: string;
  data: Uint8Array;
};

const textEncoder = new TextEncoder();
const crc32Table = buildCrc32Table();

function buildCrc32Table() {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i += 1) {
    let crc = i;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) === 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }

    table[i] = crc >>> 0;
  }

  return table;
}

function computeCrc32(data: Uint8Array) {
  let crc = 0xffffffff;

  for (const value of data) {
    crc = crc32Table[(crc ^ value) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  return JSON.stringify(value);
}

function escapeCsv(value: string) {
  if (value.includes('"')) {
    value = value.replaceAll('"', '""');
  }

  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value}"`;
  }

  return value;
}

function createCsvFromRows(rows: Record<string, unknown>[]) {
  if (!rows.length) {
    return "";
  }

  const columns = Array.from(
    rows.reduce((set, row) => {
      for (const key of Object.keys(row)) {
        set.add(key);
      }

      return set;
    }, new Set<string>()),
  ).sort();

  const header = columns.join(",");
  const lines = rows.map((row) =>
    columns
      .map((column) => escapeCsv(normalizeValue(row[column])))
      .join(","),
  );

  return [header, ...lines].join("\n");
}

function toRows(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function addCsvFile(
  files: ExportArchiveFile[],
  name: string,
  rows: Record<string, unknown>[],
) {
  if (!rows.length) {
    return;
  }

  files.push({
    name,
    data: textEncoder.encode(createCsvFromRows(rows)),
  });
}

function buildReadme(bundle: UserDataExportBundle) {
  const lines = [
    "Fit data export",
    `Generated at: ${bundle.generatedAt}`,
    `User ID: ${bundle.user.id}`,
    `Email: ${bundle.user.email ?? "unknown"}`,
    "",
    "Files:",
    "- export.json: complete structured export",
    "- summary.csv: export counters",
    "- *.csv: table-oriented slices for spreadsheet import",
  ];

  return textEncoder.encode(lines.join("\n"));
}

function pushUInt16(buffer: number[], value: number) {
  buffer.push(value & 0xff, (value >>> 8) & 0xff);
}

function pushUInt32(buffer: number[], value: number) {
  buffer.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  );
}

function buildStoredZip(files: ExportArchiveFile[]) {
  const localParts: number[] = [];
  const centralParts: number[] = [];
  let offset = 0;

  for (const file of files) {
    const fileName = textEncoder.encode(file.name);
    const crc32 = computeCrc32(file.data);
    const fileSize = file.data.byteLength;

    const localHeader: number[] = [];
    pushUInt32(localHeader, 0x04034b50);
    pushUInt16(localHeader, 20);
    pushUInt16(localHeader, 0);
    pushUInt16(localHeader, 0);
    pushUInt16(localHeader, 0);
    pushUInt16(localHeader, 0);
    pushUInt32(localHeader, crc32);
    pushUInt32(localHeader, fileSize);
    pushUInt32(localHeader, fileSize);
    pushUInt16(localHeader, fileName.byteLength);
    pushUInt16(localHeader, 0);
    localParts.push(...localHeader, ...fileName, ...file.data);

    const centralHeader: number[] = [];
    pushUInt32(centralHeader, 0x02014b50);
    pushUInt16(centralHeader, 20);
    pushUInt16(centralHeader, 20);
    pushUInt16(centralHeader, 0);
    pushUInt16(centralHeader, 0);
    pushUInt16(centralHeader, 0);
    pushUInt16(centralHeader, 0);
    pushUInt32(centralHeader, crc32);
    pushUInt32(centralHeader, fileSize);
    pushUInt32(centralHeader, fileSize);
    pushUInt16(centralHeader, fileName.byteLength);
    pushUInt16(centralHeader, 0);
    pushUInt16(centralHeader, 0);
    pushUInt16(centralHeader, 0);
    pushUInt16(centralHeader, 0);
    pushUInt32(centralHeader, 0);
    pushUInt32(centralHeader, offset);
    centralParts.push(...centralHeader, ...fileName);

    offset += localHeader.length + fileName.byteLength + fileSize;
  }

  const centralDirectoryOffset = localParts.length;
  const endOfCentralDirectory: number[] = [];
  pushUInt32(endOfCentralDirectory, 0x06054b50);
  pushUInt16(endOfCentralDirectory, 0);
  pushUInt16(endOfCentralDirectory, 0);
  pushUInt16(endOfCentralDirectory, files.length);
  pushUInt16(endOfCentralDirectory, files.length);
  pushUInt32(endOfCentralDirectory, centralParts.length);
  pushUInt32(endOfCentralDirectory, centralDirectoryOffset);
  pushUInt16(endOfCentralDirectory, 0);

  return new Uint8Array([
    ...localParts,
    ...centralParts,
    ...endOfCentralDirectory,
  ]);
}

export function buildUserDataExportArchive(bundle: UserDataExportBundle) {
  const files: ExportArchiveFile[] = [
    {
      name: "README.txt",
      data: buildReadme(bundle),
    },
    {
      name: "export.json",
      data: textEncoder.encode(JSON.stringify(bundle, null, 2)),
    },
    {
      name: "summary.csv",
      data: textEncoder.encode(
        createCsvFromRows([
          {
            generatedAt: bundle.generatedAt,
            userEmail: bundle.user.email,
            userId: bundle.user.id,
            ...bundle.summary,
          },
        ]),
      ),
    },
  ];

  addCsvFile(files, "goals/history.csv", toRows(bundle.goals.history));
  addCsvFile(files, "goals/nutrition_goals.csv", toRows(bundle.goals.nutrition));
  addCsvFile(
    files,
    "workouts/exercise_library.csv",
    toRows(bundle.workouts.exerciseLibrary),
  );
  addCsvFile(
    files,
    "workouts/workout_templates.csv",
    toRows(bundle.workouts.workoutTemplates),
  );
  addCsvFile(
    files,
    "workouts/weekly_programs.csv",
    toRows(bundle.workouts.weeklyPrograms),
  );
  addCsvFile(files, "workouts/workout_days.csv", toRows(bundle.workouts.workoutDays));
  addCsvFile(files, "workouts/workout_sets.csv", toRows(bundle.workouts.workoutSets));
  addCsvFile(files, "nutrition/foods.csv", toRows(bundle.nutrition.foods));
  addCsvFile(files, "nutrition/meals.csv", toRows(bundle.nutrition.meals));
  addCsvFile(
    files,
    "nutrition/meal_templates.csv",
    toRows(bundle.nutrition.mealTemplates),
  );
  addCsvFile(files, "nutrition/recipes.csv", toRows(bundle.nutrition.recipes));
  addCsvFile(
    files,
    "nutrition/recipe_items.csv",
    toRows(bundle.nutrition.recipeItems),
  );
  addCsvFile(
    files,
    "nutrition/body_metrics.csv",
    toRows(bundle.nutrition.bodyMetrics),
  );
  addCsvFile(files, "ai/chat_sessions.csv", toRows(bundle.ai.chatSessions));
  addCsvFile(files, "ai/chat_messages.csv", toRows(bundle.ai.chatMessages));
  addCsvFile(files, "ai/memory_facts.csv", toRows(bundle.ai.memoryFacts));
  addCsvFile(
    files,
    "ai/context_snapshots.csv",
    toRows(bundle.ai.contextSnapshots),
  );
  addCsvFile(files, "billing/subscriptions.csv", toRows(bundle.billing.subscriptions));
  addCsvFile(files, "billing/entitlements.csv", toRows(bundle.billing.entitlements));
  addCsvFile(
    files,
    "billing/usage_counters.csv",
    toRows(bundle.billing.usageCounters),
  );
  addCsvFile(files, "privacy/export_jobs.csv", toRows(bundle.privacy.exportJobs));
  addCsvFile(
    files,
    "privacy/deletion_requests.csv",
    toRows(bundle.privacy.deletionRequests),
  );

  return buildStoredZip(files);
}
