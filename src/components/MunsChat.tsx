import { useMemo, useState } from "react";
import { TableShell } from "./TableShell";
import { Tag } from "./StatusTag";
import {
  callMunsChat,
  cleanMunsRaw,
  extractTables,
  type MunsMode,
  type ParsedTable,
} from "../utils/muns";

const DEFAULT_QUERY = "hey this is a test chat tell me about ceo of google";

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

const TableBlock = ({ table }: { table: ParsedTable }) => {
  const statusColIdx = table.columns.findIndex((c) =>
    c.toLowerCase().includes("status"),
  );
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
            <tr
              key={`tr-${rIdx}`}
              className="align-top transition-colors hover:bg-ink-100/40"
            >
              {table.columns.map((_, cIdx) => {
                const value = row[cIdx] || "";
                const isStatus = cIdx === statusColIdx && value;
                const tone = isStatus ? statusTone(value) : null;
                return (
                  <td
                    key={`td-${rIdx}-${cIdx}`}
                    className="border-b border-divider px-4 py-3 text-ink-700"
                  >
                    {tone ? <Tag tone={tone}>{value}</Tag> : value}
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

const RenderedTables = ({ content }: { content: string }) => {
  const tables = useMemo(() => extractTables(content), [content]);
  if (tables.length === 0) {
    return <p className="text-sm text-ink-400">No table in the response.</p>;
  }
  return (
    <div className="space-y-4">
      {tables.map((table, idx) => (
        <TableBlock key={`table-${idx}`} table={table} />
      ))}
    </div>
  );
};

export function MunsChat() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [mode, setMode] = useState<MunsMode>("fast");
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
      const raw = await callMunsChat({
        tasks: [task],
        countries: ["India"],
        mode,
      });
      setRawOutput(raw);
      setCleaned(cleanMunsRaw(raw));
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
            <h2 className="mt-1 text-[18px] font-semibold text-ink-900">Ask MUNS</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">
              Runs a single prompt against{" "}
              <span className="font-mono text-[12px]">/chat/chat-muns</span> with web
              search enabled. Edit the prompt and press Run.
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
          <div className="space-y-4 px-6 pb-6">
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
                  <RenderedTables content={cleaned} />
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
  mode: MunsMode;
  onChange: (mode: MunsMode) => void;
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
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
