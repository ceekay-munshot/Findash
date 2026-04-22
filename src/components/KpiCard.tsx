type Tone = "neutral" | "green" | "amber" | "grey" | "red" | "slate";

type Props = {
  label: string;
  value: string;
  subtext?: string;
  tone?: Tone;
};

const toneMap: Record<Tone, { dot: string; tag: string }> = {
  neutral: { dot: "bg-ink-300", tag: "bg-ink-100 text-ink-700" },
  green: { dot: "bg-accent-green", tag: "bg-accent-greenSoft text-accent-green" },
  amber: { dot: "bg-accent-amber", tag: "bg-accent-amberSoft text-accent-amber" },
  grey: { dot: "bg-ink-300", tag: "bg-ink-100 text-ink-500" },
  red: { dot: "bg-accent-red", tag: "bg-accent-redSoft text-accent-red" },
  slate: { dot: "bg-accent-slate", tag: "bg-accent-slateSoft text-accent-slate" },
};

export function KpiCard({ label, value, subtext, tone = "neutral" }: Props) {
  const t = toneMap[tone];
  return (
    <div className="rounded-xl2 bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${t.dot}`} />
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
          {label}
        </div>
      </div>
      <div className="mt-3 text-[26px] font-semibold leading-none tracking-tight text-ink-900">
        {value}
      </div>
      {subtext && (
        <div className="mt-2 text-xs text-ink-500">{subtext}</div>
      )}
    </div>
  );
}
