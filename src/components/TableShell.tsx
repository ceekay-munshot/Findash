type Props = {
  title: string;
  subtitle?: string;
  onExport?: () => void;
  children: React.ReactNode;
};

export function TableShell({ title, subtitle, onExport, children }: Props) {
  return (
    <section className="rounded-xl2 bg-surface shadow-card">
      <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
            Table
          </div>
          <h2 className="mt-1 text-[18px] font-semibold text-ink-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">
              {subtitle}
            </p>
          )}
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-divider bg-surface px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-100 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="m7 10 5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            Export CSV
          </button>
        )}
      </header>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
