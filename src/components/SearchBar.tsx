import { useState, useEffect } from "react";

type Props = {
  value: string;
  onSubmit: (q: string) => void;
};

export function SearchBar({ value, onSubmit }: Props) {
  const [q, setQ] = useState(value);

  useEffect(() => {
    setQ(value);
  }, [value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) onSubmit(q.trim());
      }}
      className="w-full"
    >
      <div className="relative">
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
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search any company…"
          className="w-full rounded-xl2 border border-divider bg-surface pl-11 pr-28 py-3.5 text-[15px] text-ink-900 placeholder:text-ink-400 shadow-soft focus:outline-none focus:border-ink-500 focus:ring-0 transition-colors"
          aria-label="Search any company"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:bg-ink-700 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
