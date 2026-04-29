const SUSPICIOUS_MOJIBAKE_PATTERN =
  /(?:[РС][\u0450-\u04ff]|в[\u0080-\u04ff]|Â[\u0080-\u04ff]){3,}/u;

const WINDOWS_1251_SPECIALS = new Map<number, number>([
  [0x0402, 0x80],
  [0x0403, 0x81],
  [0x201a, 0x82],
  [0x0453, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x20ac, 0x88],
  [0x2030, 0x89],
  [0x0409, 0x8a],
  [0x2039, 0x8b],
  [0x040a, 0x8c],
  [0x040c, 0x8d],
  [0x040b, 0x8e],
  [0x040f, 0x8f],
  [0x0452, 0x90],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x0098, 0x98],
  [0x2122, 0x99],
  [0x0459, 0x9a],
  [0x203a, 0x9b],
  [0x045a, 0x9c],
  [0x045c, 0x9d],
  [0x045b, 0x9e],
  [0x045f, 0x9f],
  [0x00a0, 0xa0],
  [0x040e, 0xa1],
  [0x045e, 0xa2],
  [0x0408, 0xa3],
  [0x00a4, 0xa4],
  [0x0490, 0xa5],
  [0x00a6, 0xa6],
  [0x00a7, 0xa7],
  [0x0401, 0xa8],
  [0x00a9, 0xa9],
  [0x0404, 0xaa],
  [0x00ab, 0xab],
  [0x00ac, 0xac],
  [0x00ad, 0xad],
  [0x00ae, 0xae],
  [0x0407, 0xaf],
  [0x00b0, 0xb0],
  [0x00b1, 0xb1],
  [0x0406, 0xb2],
  [0x0456, 0xb3],
  [0x0491, 0xb4],
  [0x00b5, 0xb5],
  [0x00b6, 0xb6],
  [0x00b7, 0xb7],
  [0x0451, 0xb8],
  [0x2116, 0xb9],
  [0x0454, 0xba],
  [0x00bb, 0xbb],
  [0x0458, 0xbc],
  [0x0405, 0xbd],
  [0x0455, 0xbe],
  [0x0457, 0xbf],
]);

function getTextQualityScore(value: string) {
  const cyrillicCount = (value.match(/[\u0400-\u04ff]/gu) ?? []).length;
  const suspiciousCount = (
    value.match(/(?:[РС][\u0450-\u04ff]|в[\u0080-\u04ff]|Â[\u0080-\u04ff])/gu) ??
    []
  ).length;
  const replacementCount = (value.match(/\uFFFD/gu) ?? []).length;

  return cyrillicCount * 2 - suspiciousCount * 3 - replacementCount * 4;
}

function encodeWindows1251(value: string) {
  const bytes: number[] = [];

  for (const char of value) {
    const code = char.charCodeAt(0);

    if (code <= 0x7f) {
      bytes.push(code);
      continue;
    }

    if (WINDOWS_1251_SPECIALS.has(code)) {
      bytes.push(WINDOWS_1251_SPECIALS.get(code)!);
      continue;
    }

    if (code >= 0x0410 && code <= 0x044f) {
      bytes.push(code - 0x350);
      continue;
    }

    if (code <= 0xff) {
      bytes.push(code);
      continue;
    }

    bytes.push(0x3f);
  }

  return Buffer.from(bytes);
}

function repairWithWindows1251(value: string) {
  try {
    return encodeWindows1251(value).toString("utf8");
  } catch {
    return value;
  }
}

export function repairMojibakeText(value: string) {
  if (!value || !SUSPICIOUS_MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  const repaired = repairWithWindows1251(value);

  return getTextQualityScore(repaired) > getTextQualityScore(value)
    ? repaired
    : value;
}

export function repairMojibakeDeep<T>(value: T): T {
  if (typeof value === "string") {
    return repairMojibakeText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => repairMojibakeDeep(entry)) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const entries = Object.entries(value).map(([key, entry]) => [
    key,
    repairMojibakeDeep(entry),
  ]);

  return Object.fromEntries(entries) as T;
}
