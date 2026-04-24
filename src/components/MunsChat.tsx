import { useMemo, useState } from "react";
import { TableShell } from "./TableShell";
import { Tag } from "./StatusTag";

const MUNS_CHAT_URL = "https://devde.muns.io/chat/chat-muns";
const MUNS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZWE5ZGMyYi0xZDBmLTQ2MzctOGE2Ny0wM2VhNzFmMGYyY2YiLCJlbWFpbCI6Im5hZGFtc2FsdWphQGdtYWlsLmNvbSIsIm9yZ0lkIjoiMSIsImF1dGhvcml0eSI6InVzZXIiLCJpYXQiOjE3NzY2NzkyMzgsImV4cCI6MTc3NzExMTIzOH0.DjD6IxGL5EJ4mWeXO8bj8vpBNx0RaipmzBqDDbfqEdg";

const DEFAULT_QUERY = "hey this is a test chat tell me about ceo of google";

// -------------------- Cleaning / Parsing --------------------

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

const cleanText = (raw: string): string => {
  const lines = raw
    .split("\n")
    .map(stripTags)
    .filter((l) => l.length > 0)
    .filter((l) => !isNoise(l));
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

// Try to extract a textual payload from arbitrary server responses.
const extractContent = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return extractFromValue(parsed) || trimmed;
  } catch {
    return trimmed;
  }
};

const extractFromValue = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(extractFromValue).filter(Boolean).join("\n\n");
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const preferredKeys = [
      "content",
      "text",
      "output",
      "response",
      "answer",
      "result",
      "message",
      "markdown",
      "data",
      "tasks",
    ];
    for (const key of preferredKeys) {
      if (key in obj) {
        const extracted = extractFromValue(obj[key]);
        if (extracted) return extracted;
      }
    }
    // Fallback: concatenate string-like values
    return Object.values(obj).map(extractFromValue).filter(Boolean).join("\n\n");
  }
  return "";
};

// -------------------- Block Parser --------------------

type ParsedTable = {
  columns: string[];
  rows: string[][];
};

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "table"; table: ParsedTable }
  | { kind: "code"; text: string };

const isTableLine = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isTableSeparator = (line: string) =>
  /^\s*\|?[\s|\-:]+\|?\s*$/.test(line) && line.includes("-");

const parseCells = (line: string): string[] =>
  line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((cell) => cell.trim());

const parseBlocks = (raw: string): Block[] => {
  const lines = raw.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const flushParagraph = (buf: string[]) => {
    const text = buf.join(" ").trim();
    if (text) blocks.push({ kind: "paragraph", text });
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Fenced code
    if (trimmed.startsWith("```")) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        body.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1; // consume closing fence
      blocks.push({ kind: "code", text: body.join("\n") });
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        kind: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i += 1;
      continue;
    }

    // Table
    if (isTableLine(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = parseCells(line).map((c) => c.replace(/\*\*/g, "").trim());
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        const cells = parseCells(lines[i]).map((c) => c.replace(/\*\*/g, "").trim());
        rows.push(cells);
        i += 1;
      }
      blocks.push({ kind: "table", table: { columns: header, rows } });
      continue;
    }

    // Bullet / ordered list
    const bulletMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (bulletMatch || orderedMatch) {
      const ordered = Boolean(orderedMatch);
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!t) break;
        const bm = t.match(/^[-*+]\s+(.*)$/);
        const om = t.match(/^\d+\.\s+(.*)$/);
        if (ordered ? om : bm) {
          items.push(((ordered ? om![1] : bm![1]) as string).trim());
          i += 1;
          continue;
        }
        break;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    // Paragraph (collect until blank line or new block)
    const buf: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;
      if (t.match(/^(#{1,6})\s+/)) break;
      if (t.match(/^[-*+]\s+/) || t.match(/^\d+\.\s+/)) break;
      if (isTableLine(lines[i])) break;
      if (t.startsWith("```")) break;
      buf.push(t);
      i += 1;
    }
    flushParagraph(buf);
  }

  return blocks;
};

// -------------------- Inline Renderer --------------------

const renderInline = (text: string): React.ReactNode[] => {
  // Handle **bold**, *italic*, `code`, and [text](url)
  const nodes: React.ReactNode[] = [];
  const re =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const key = `inline-${keyCounter++}`;
    if (match[2] !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold text-ink-900">
          {match[2]}
        </strong>,
      );
    } else if (match[4] !== undefined) {
      nodes.push(
        <em key={key} className="italic">
          {match[4]}
        </em>,
      );
    } else if (match[6] !== undefined) {
      nodes.push(
        <code key={key} className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[12px] text-ink-900">
          {match[6]}
        </code>,
      );
    } else if (match[8] !== undefined && match[9] !== undefined) {
      nodes.push(
        <a
          key={key}
          href={match[9]}
          target="_blank"
          rel="noreferrer"
          className="text-accent-slate underline decoration-ink-300 underline-offset-2 hover:text-ink-900"
        >
          {match[8]}
        </a>,
      );
    }
    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
};

// -------------------- Status helpers --------------------

const statusTone = (value: string) => {
  const v = value.trim().toLowerCase();
  if (["pass", "yes", "good", "positive", "experienced", "sufficient"].includes(v))
    return "green" as const;
  if (["fail", "no", "poor", "negative", "not experienced"].includes(v))
    return "red" as const;
  if (["warning", "increased", "above average"].includes(v)) return "amber" as const;
  if (["info", "decreased"].includes(v)) return "slate" as const;
  return null;
};

// -------------------- Block Renderers --------------------

const HeadingBlock = ({ level, text }: { level: number; text: string }) => {
  if (level <= 1)
    return (
      <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-ink-900">
        {renderInline(text)}
      </h2>
    );
  if (level === 2)
    return (
      <h3 className="mt-2 text-[17px] font-semibold text-ink-900">
        {renderInline(text)}
      </h3>
    );
  return (
    <h4 className="mt-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-ink-500">
      {renderInline(text)}
    </h4>
  );
};

const ParagraphBlock = ({ text }: { text: string }) => (
  <p className="text-sm leading-relaxed text-ink-700">{renderInline(text)}</p>
);

const ListBlock = ({ ordered, items }: { ordered: boolean; items: string[] }) => {
  const commonClasses = "space-y-1.5 pl-5 text-sm leading-relaxed text-ink-700";
  if (ordered) {
    return (
      <ol className={`${commonClasses} list-decimal`}>
        {items.map((item, idx) => (
          <li key={`li-${idx}`} className="marker:text-ink-400">
            {renderInline(item)}
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ul className={`${commonClasses} list-disc`}>
      {items.map((item, idx) => (
        <li key={`li-${idx}`} className="marker:text-ink-400">
          {renderInline(item)}
        </li>
      ))}
    </ul>
  );
};

const TableBlock = ({ table }: { table: ParsedTable }) => {
  const statusColIdx = table.columns.findIndex((c) => c.toLowerCase().includes("status"));
  return (
    <div className="rounded-xl2 border border-divider bg-surface overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead className="bg-ink-100/50">
          <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-500">
            {table.columns.map((col, idx) => (
              <th
                key={`th-${idx}`}
                className="border-b border-divider px-4 py-3 font-medium"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rIdx) => (
            <tr key={`tr-${rIdx}`} className="align-top hover:bg-ink-100/40 transition-colors">
              {table.columns.map((_, cIdx) => {
                const value = row[cIdx] || "";
                const isStatus = cIdx === statusColIdx && value;
                const tone = isStatus ? statusTone(value) : null;
                return (
                  <td
                    key={`td-${rIdx}-${cIdx}`}
                    className="border-b border-divider px-4 py-3 text-ink-700"
                  >
                    {tone ? <Tag tone={tone}>{value}</Tag> : renderInline(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CodeBlock = ({ text }: { text: string }) => (
  <pre className="overflow-x-auto rounded-xl2 border border-divider bg-ink-900 p-4 text-[12px] text-ink-100">
    <code>{text}</code>
  </pre>
);

const RenderedOutput = ({ content }: { content: string }) => {
  const blocks = useMemo(() => parseBlocks(content), [content]);
  if (blocks.length === 0) {
    return <p className="text-sm text-ink-400">No content.</p>;
  }
  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => {
        const key = `block-${idx}`;
        if (block.kind === "heading")
          return <HeadingBlock key={key} level={block.level} text={block.text} />;
        if (block.kind === "paragraph")
          return <ParagraphBlock key={key} text={block.text} />;
        if (block.kind === "list")
          return <ListBlock key={key} ordered={block.ordered} items={block.items} />;
        if (block.kind === "table") return <TableBlock key={key} table={block.table} />;
        return <CodeBlock key={key} text={block.text} />;
      })}
    </div>
  );
};

// -------------------- Main Component --------------------

type Mode = "fast" | "deep";

export function MunsChat() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [mode, setMode] = useState<Mode>("fast");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleaned, setCleaned] = useState("");
  const [rawOutput, setRawOutput] = useState("");
  const [view, setView] = useState<"report" | "raw">("report");

  const handleRun = async () => {
    const task = query.trim();
    if (!task) {
      setError("Enter a prompt before running.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(MUNS_CHAT_URL, {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${MUNS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: [task],
          query_context: {
            ANNOUNCEMENT_FORM_TYPE: "all",
            DOCUMENT_IDS: [],
            CATEGORIES: [],
            WEB_SEARCH_ENABLED: true,
            COUNTRY: ["India"],
            GET_ANNOUNCEMENTS_ENABLED: false,
            chatHistory: [],
            mode,
          },
          autoAddUpcoming: false,
          urls: [],
        }),
      });

      const raw = await response.text();
      setRawOutput(raw);

      if (!response.ok) {
        setCleaned("");
        setError(`Request failed (${response.status}).`);
        return;
      }

      const extracted = extractContent(raw);
      setCleaned(cleanText(extracted));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
      setCleaned("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl2 bg-surface p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
              MUNS Chat
            </div>
            <h2 className="mt-1 text-[18px] font-semibold text-ink-900">
              Ask MUNS
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">
              Runs a single prompt against <span className="font-mono text-[12px]">/chat/chat-muns</span>
              {" "}with web search enabled. Edit the prompt and press Run.
            </p>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        <div className="mt-4 space-y-3">
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500">
            Prompt
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            className="w-full rounded-xl2 border border-divider bg-surface px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-200/60"
            placeholder="Ask something..."
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-surface hover:bg-ink-700 disabled:bg-ink-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Spinner />
                  Running...
                </>
              ) : (
                <>
                  <PlayIcon />
                  Run
                </>
              )}
            </button>
            {(cleaned || rawOutput) && !loading && (
              <button
                onClick={() => {
                  setCleaned("");
                  setRawOutput("");
                  setError(null);
                }}
                className="inline-flex items-center rounded-lg border border-divider bg-surface px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-100 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl2 border border-accent-red/30 bg-accent-redSoft px-5 py-4 text-sm text-accent-red">
          {error}
        </div>
      )}

      {(cleaned || rawOutput) && !error && (
        <TableShell
          title="Response"
          subtitle={`Mode: ${mode} · cleaned of tool/log noise`}
        >
          <div className="px-6 pb-6 space-y-4">
            <div className="flex gap-1 border-b border-divider">
              <ViewTab active={view === "report"} onClick={() => setView("report")}>
                Report
              </ViewTab>
              <ViewTab active={view === "raw"} onClick={() => setView("raw")}>
                Raw
              </ViewTab>
            </div>
            <div className="pt-2">
              {view === "report" ? (
                cleaned ? (
                  <RenderedOutput content={cleaned} />
                ) : (
                  <p className="text-sm text-ink-400">No parsed content — check Raw.</p>
                )
              ) : (
                <pre className="max-h-[520px] overflow-auto rounded-xl2 border border-divider bg-ink-100/50 p-4 text-[12px] leading-relaxed text-ink-700 whitespace-pre-wrap">
                  {rawOutput}
                </pre>
              )}
            </div>
          </div>
        </TableShell>
      )}
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <div className="flex shrink-0 rounded-lg border border-divider bg-surface p-0.5 text-xs font-medium">
      {(["fast", "deep"] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={[
              "rounded-md px-3 py-1.5 capitalize transition-colors",
              active ? "bg-ink-900 text-surface" : "text-ink-500 hover:text-ink-900",
            ].join(" ")}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}

function ViewTab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative -mb-px px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] transition-colors",
        active ? "text-ink-900" : "text-ink-400 hover:text-ink-700",
      ].join(" ")}
    >
      {children}
      {active && (
        <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ink-900" />
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
