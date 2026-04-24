import type { CapexProject, CapexStatus, TimingView } from "../types";

// -------------------- Config --------------------

export const MUNS_CHAT_URL = "https://devde.muns.io/chat/chat-muns";

export const MUNS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZWE5ZGMyYi0xZDBmLTQ2MzctOGE2Ny0wM2VhNzFmMGYyY2YiLCJlbWFpbCI6Im5hZGFtc2FsdWphQGdtYWlsLmNvbSIsIm9yZ0lkIjoiMSIsImF1dGhvcml0eSI6InVzZXIiLCJpYXQiOjE3NzY2NzkyMzgsImV4cCI6MTc3NzExMTIzOH0.DjD6IxGL5EJ4mWeXO8bj8vpBNx0RaipmzBqDDbfqEdg";

export const CAPEX_TABLE_PROMPT =
  "Make one table with Factual data only to show project status of company- Get the latest verified data( Announcement , Annual report , Call transcript , earnings PPT) possible .Follow the column order exactly.-Serial No. | Project | Segment | Capex | Current timeline note | Current status | Latest timing view ( with dates if available ) | Capacity addition | Source Do not add extra columns. Do not merge columns. Do not explain outside the table.";

// -------------------- API --------------------

export type MunsMode = "fast" | "deep";

export interface MunsChatInput {
  tasks: string[];
  tickerSymbol?: string;
  contextCompanyName?: string;
  countries?: string[];
  mode?: MunsMode;
}

export async function callMunsChat(input: MunsChatInput): Promise<string> {
  const body = {
    tasks: input.tasks,
    query_context: {
      ...(input.tickerSymbol ? { TICKER_SYMBOL: [input.tickerSymbol] } : {}),
      ANNOUNCEMENT_FORM_TYPE: "all",
      DOCUMENT_IDS: [],
      CATEGORIES: [],
      WEB_SEARCH_ENABLED: true,
      ...(input.contextCompanyName
        ? { CONTEXT_COMPANY_NAME: [input.contextCompanyName] }
        : {}),
      ...(input.countries && input.countries.length > 0
        ? { COUNTRY: input.countries }
        : {}),
      GET_ANNOUNCEMENTS_ENABLED: false,
      chatHistory: [],
      mode: input.mode || "fast",
    },
    autoAddUpcoming: false,
    urls: [],
  };

  const response = await fetch(MUNS_CHAT_URL, {
    method: "POST",
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${MUNS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`MUNS request failed (${response.status})`);
  }
  return raw;
}

// -------------------- Cleaning --------------------

const DROP_SECTION_TAGS = ["task", "tool", "sources", "eos", "thinking", "trace"];

const NOISE_PATTERNS: RegExp[] = [
  /^WriteTodos:?/i,
  /^NewsSearch:?/i,
  /^WebSearch:?/i,
  /^WebReader:?/i,
  /^DocumentFetch:?/i,
  /^PythonRepl:?/i,
  /^GetAnnouncements:?/i,
  /^HTTP\/\d/i,
  /^(server|date|content-type|x-powered-by|access-control-allow-origin|x-request-id|x-ratelimit-limit|x-ratelimit-remaining|x-ratelimit-reset|cache-control|access-control-expose-headers):/i,
  /^H4sI[A-Za-z0-9+/=]+$/,
  /H4sI[A-Za-z0-9+/=]{120,}/,
  /^[A-Za-z0-9+/]{200,}={0,2}$/,
];

const stripTags = (value: string) => value.replace(/<[^>]+>/g, "").trim();
const isNoise = (line: string) => NOISE_PATTERNS.some((rx) => rx.test(line));

const dropWrapperSections = (raw: string): string => {
  let out = raw;
  for (const tag of DROP_SECTION_TAGS) {
    const paired = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    out = out.replace(paired, "");
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
    out = out.replace(selfClosing, "");
  }
  return out;
};

export const isolateAnswer = (raw: string): string => {
  const ansMatches = [...raw.matchAll(/<ans\b[^>]*>([\s\S]*?)<\/ans>/gi)];
  if (ansMatches.length > 0) {
    return ansMatches.map((m) => m[1]).join("\n\n").trim();
  }
  return dropWrapperSections(raw).trim();
};

export const cleanMunsRaw = (raw: string): string => {
  const isolated = isolateAnswer(raw);
  const lines = isolated
    .split("\n")
    .map(stripTags)
    .filter((l) => l.length > 0)
    .filter((l) => !isNoise(l));
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

// -------------------- Table Parsing --------------------

export type ParsedTable = {
  columns: string[];
  rows: string[][];
};

const isTableLine = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isTableSeparator = (line: string) =>
  /^\s*\|?[\s|\-:]+\|?\s*$/.test(line) && line.includes("-");

const parseCells = (line: string): string[] =>
  line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((cell) => cell.trim());

export const extractTables = (cleaned: string): ParsedTable[] => {
  const lines = cleaned.split("\n");
  const tables: ParsedTable[] = [];
  let i = 0;

  while (i < lines.length) {
    if (
      isTableLine(lines[i]) &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const header = parseCells(lines[i]).map((c) =>
        c.replace(/\*\*/g, "").trim(),
      );
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        rows.push(
          parseCells(lines[i]).map((c) => c.replace(/\*\*/g, "").trim()),
        );
        i += 1;
      }
      tables.push({ columns: header, rows });
      continue;
    }
    i += 1;
  }
  return tables;
};

export const extractFirstTable = (cleaned: string): ParsedTable | null => {
  const all = extractTables(cleaned);
  return all[0] || null;
};

// -------------------- Capex Mapping --------------------

const mapStatus = (raw: string): CapexStatus => {
  const v = raw.toLowerCase();
  if (/delayed/.test(v)) return "Delayed";
  if (/uncertain|unclear/.test(v)) return "Uncertain";
  if (/feasibility/.test(v)) return "Feasibility";
  if (
    /(operational|commissioned|completed)/.test(v) &&
    !/(scheduled|timeline indicated|planned)/.test(v)
  ) {
    return "Operational";
  }
  if (
    /(executing|under construction|in progress|ongoing|advanced|ramp|initiated|drilling|underway)/.test(
      v,
    )
  ) {
    return "Executing";
  }
  if (/(planning|planned|under development|scheduled|announced)/.test(v)) {
    return "Planning";
  }
  return "Executing";
};

const mapTiming = (raw: string): TimingView => {
  const v = raw.toLowerCase();
  if (/unclear|not disclosed|tbd|n\/a/.test(v)) return "Unclear";
  if (/fy\s?2?8|fy\s?2?9|long[- ]?term/.test(v)) return "Long-term";
  if (/fy\s?2?7|medium[- ]?term/.test(v)) return "Medium-term";
  if (/fy\s?2?6|q[1-4]\s?fy\s?2?6|1h\s?fy\s?2?6|2h\s?fy\s?2?6|near[- ]?term/.test(v)) {
    return "Near-term";
  }
  return "Medium-term";
};

// Best-effort numeric extraction; returns Rs cr. Rough unit conversion for
// USD billion/million when present. Values that only say "not disclosed"
// fall to 0, which keeps the KPI math honest.
const parseCapexCr = (raw: string): number => {
  const clean = raw.replace(/,/g, "").toLowerCase();
  const numMatch = clean.match(/([\d]+(?:\.[\d]+)?)/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[1]);
  if (!Number.isFinite(num) || num <= 0) return 0;
  if (/(us\$|usd|\$).*?(billion|bn)|(billion|bn)/.test(clean)) {
    return Math.round(num * 8300);
  }
  if (/(us\$|usd|\$).*?(million|mn)|(million|mn)/.test(clean)) {
    return Math.round(num * 8.3);
  }
  if (/(crore|cr)\b/.test(clean)) return Math.round(num);
  if (/\blakh/.test(clean)) return Math.round(num / 10);
  return Math.round(num);
};

const findColumnIndex = (columns: string[], ...needles: string[]): number => {
  for (let i = 0; i < columns.length; i += 1) {
    const c = columns[i].toLowerCase();
    if (needles.some((n) => c.includes(n))) return i;
  }
  return -1;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "row";

export const toCapexProjects = (table: ParsedTable): CapexProject[] => {
  const cols = table.columns;
  const projectIdx = findColumnIndex(cols, "project");
  const segmentIdx = findColumnIndex(cols, "segment");
  const capexIdx = findColumnIndex(cols, "capex");
  const timelineIdx = findColumnIndex(cols, "timeline note", "timeline");
  const statusIdx = findColumnIndex(cols, "current status", "status");
  const timingIdx = findColumnIndex(cols, "timing view", "timing");
  const capacityIdx = findColumnIndex(cols, "capacity addition", "capacity");

  const cell = (row: string[], idx: number) => (idx >= 0 ? row[idx] || "" : "");

  return table.rows
    .filter((row) => cell(row, projectIdx).trim().length > 0)
    .map((row, idx) => {
      const project = cell(row, projectIdx);
      return {
        id: `${idx + 1}-${slugify(project)}`,
        project,
        segment: cell(row, segmentIdx) || "—",
        capexRsCr: parseCapexCr(cell(row, capexIdx)),
        timelineNote: cell(row, timelineIdx) || "—",
        status: mapStatus(cell(row, statusIdx)),
        timingView: mapTiming(cell(row, timingIdx)),
        capacityAddition: cell(row, capacityIdx) || "—",
      };
    });
};
