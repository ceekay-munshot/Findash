import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchBirdnest, type BirdnestEntry } from "../lib/birdnestSearch";

type Props = {
  value: string;
  onSelect: (entry: BirdnestEntry) => void;
};

export function SearchBar({ value, onSelect }: Props) {
  const [q, setQ] = useState(value);
  const [results, setResults] = useState<BirdnestEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Debounced search against Birdnest.
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const trimmed = q.trim();
      if (trimmed.length < 1) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await searchBirdnest(trimmed, controller.signal);
        setResults(data);
        setHighlight(0);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setResults([]);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [q]);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const visible = useMemo(
    () => (open && q.trim().length > 0 ? results : []),
    [open, q, results],
  );

  function pick(entry: BirdnestEntry) {
    onSelect(entry);
    setQ(entry.name);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(visible.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (visible[highlight]) {
        e.preventDefault();
        pick(visible[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown =
    open &&
    q.trim().length > 0 &&
    (loading || error !== null || visible.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
        Company name
      </div>
      <div className="relative mt-2">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search any company…"
          className="w-full rounded-xl2 border border-divider bg-surface pl-11 pr-12 py-3.5 text-[15px] text-ink-900 placeholder:text-ink-400 shadow-soft focus:outline-none focus:border-ink-500 focus:ring-0 transition-colors"
          aria-label="Search any company"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
        />
        {loading && (
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-ink-700"
            aria-hidden="true"
          />
        )}
      </div>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl2 border border-divider bg-surface shadow-card"
        >
          {error && (
            <div className="px-4 py-3 text-sm text-accent-red">{error}</div>
          )}
          {!error && visible.length === 0 && !loading && (
            <div className="px-4 py-3 text-sm text-ink-500">
              No matches for “{q.trim()}”.
            </div>
          )}
          {!error && visible.length > 0 && (
            <ul className="max-h-72 overflow-y-auto">
              {visible.map((entry, i) => {
                const active = i === highlight;
                return (
                  <li
                    key={entry.ticker}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => {
                      // mousedown so the input's blur doesn't close before we pick
                      e.preventDefault();
                      pick(entry);
                    }}
                    className={[
                      "flex cursor-pointer items-center justify-between gap-3 border-b border-divider px-4 py-3 last:border-b-0",
                      active ? "bg-ink-100" : "hover:bg-ink-100",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium text-ink-900">
                        {entry.name}
                      </div>
                      <div className="truncate text-[12px] text-ink-500">
                        {entry.industry || "—"}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-accent-slateSoft px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-slate">
                      {entry.ticker}
                      {entry.country ? ` · ${entry.country}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
