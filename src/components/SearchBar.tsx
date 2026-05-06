import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchBirdnest, type BirdnestEntry } from "../lib/birdnestSearch";

type Props = {
  companyName: string;
  ticker: string;
  disabled?: boolean;
  onSubmit: (input: { companyName: string; ticker: string }) => void;
};

export function SearchBar({ companyName, ticker, disabled, onSubmit }: Props) {
  const [name, setName] = useState(companyName);
  const [sym, setSym] = useState(ticker);

  const [results, setResults] = useState<BirdnestEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  // Suppress the dropdown the next time `name` changes (used after picking).
  const skipNextSearch = useRef(false);

  // Debounced Birdnest search keyed off the company-name input.
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const trimmed = name.trim();
      if (trimmed.length < 1) {
        setResults([]);
        setError(null);
        setLoadingResults(false);
        return;
      }
      setLoadingResults(true);
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
        setLoadingResults(false);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [name]);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const visible = useMemo(
    () => (open && name.trim().length > 0 ? results : []),
    [open, name, results],
  );

  function pick(entry: BirdnestEntry) {
    skipNextSearch.current = true;
    setName(entry.name);
    setSym(entry.ticker.toUpperCase());
    setOpen(false);
    setResults([]);
    nameInputRef.current?.blur();
  }

  function onNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(visible.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && visible[highlight]) {
      e.preventDefault();
      pick(visible[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown =
    open &&
    name.trim().length > 0 &&
    (loadingResults || error !== null || visible.length > 0);

  const canSubmit = name.trim().length > 0 && sym.trim().length > 0 && !disabled;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setOpen(false);
        onSubmit({ companyName: name.trim(), ticker: sym.trim().toUpperCase() });
      }}
      className="w-full"
    >
      <div className="flex flex-col gap-2 rounded-xl2 border border-divider bg-surface p-2 shadow-soft sm:flex-row sm:items-stretch">
        <div ref={containerRef} className="relative flex-1">
          <label className="relative block">
            <span className="sr-only">Enter company name</span>
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
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
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v14" />
              <path d="M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
            </svg>
            <input
              ref={nameInputRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onNameKeyDown}
              placeholder="Enter company name"
              className="w-full rounded-lg bg-transparent pl-10 pr-9 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
              aria-label="Enter company name"
              role="combobox"
              aria-expanded={showDropdown}
              aria-controls={listboxId}
              aria-autocomplete="list"
              autoComplete="off"
              disabled={disabled}
            />
            {loadingResults && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-ink-700"
                aria-hidden="true"
              />
            )}
          </label>

          {showDropdown && (
            <div
              id={listboxId}
              role="listbox"
              className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl2 border border-divider bg-surface shadow-card"
            >
              {error && (
                <div className="px-4 py-3 text-sm text-accent-red">{error}</div>
              )}
              {!error && visible.length === 0 && !loadingResults && (
                <div className="px-4 py-3 text-sm text-ink-500">
                  No matches for “{name.trim()}”.
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

        <div className="hidden w-px self-stretch bg-divider sm:block" />

        <label className="relative flex-1 sm:max-w-[220px]">
          <span className="sr-only">Enter company ticker</span>
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
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
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h10" />
          </svg>
          <input
            value={sym}
            onChange={(e) => setSym(e.target.value.toUpperCase())}
            placeholder="Enter company ticker"
            className="w-full rounded-lg bg-transparent pl-10 pr-3 py-2.5 text-[15px] font-mono uppercase tracking-wide text-ink-900 placeholder:font-sans placeholder:normal-case placeholder:text-ink-400 focus:outline-none"
            aria-label="Enter company ticker"
            spellCheck={false}
            disabled={disabled}
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink-700 disabled:bg-ink-300 disabled:cursor-not-allowed"
        >
          {disabled ? "Searching…" : "Search"}
        </button>
      </div>
    </form>
  );
}
