type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
};

export function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div role="tablist" className="border-b border-divider">
      <div className="flex gap-1">
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(t.id)}
              className={[
                "relative -mb-px px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "text-ink-900"
                  : "text-ink-500 hover:text-ink-700",
              ].join(" ")}
            >
              {t.label}
              {isActive && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ink-900" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
