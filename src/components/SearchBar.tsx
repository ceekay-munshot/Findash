import { useEffect, useState } from "react";

type Props = {
  companyName: string;
  ticker: string;
  disabled?: boolean;
  onSubmit: (input: { companyName: string; ticker: string }) => void;
};

export function SearchBar({ companyName, ticker, disabled, onSubmit }: Props) {
  const [name, setName] = useState(companyName);
  const [sym, setSym] = useState(ticker);

  useEffect(() => {
    setName(companyName);
  }, [companyName]);

  useEffect(() => {
    setSym(ticker);
  }, [ticker]);

  const canSubmit = name.trim().length > 0 && sym.trim().length > 0 && !disabled;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ companyName: name.trim(), ticker: sym.trim().toUpperCase() });
      }}
      className="w-full"
    >
      <div className="flex flex-col gap-2 rounded-xl2 border border-divider bg-surface p-2 shadow-soft sm:flex-row sm:items-stretch">
        <label className="relative flex-1">
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter company name"
            className="w-full rounded-lg bg-transparent pl-10 pr-3 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
            aria-label="Enter company name"
            disabled={disabled}
          />
        </label>

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
