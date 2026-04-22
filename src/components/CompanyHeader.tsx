import type { Company } from "../types";

type Props = {
  company: Company;
};

export function CompanyHeader({ company }: Props) {
  return (
    <div className="flex items-end justify-between gap-6 pt-6">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-ink-400">
          Company
        </div>
        <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink-900">
          {company.name}
        </h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-ink-500">
          <span className="font-medium text-ink-700">{company.ticker}</span>
          <span className="text-ink-300">·</span>
          <span>{company.sector}</span>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-xs text-ink-400">
        <span className="inline-flex h-2 w-2 rounded-full bg-accent-green" />
        Last disclosed figures
      </div>
    </div>
  );
}
