import type { Company } from "../types";
import { KpiCard } from "./KpiCard";
import { TableShell } from "./TableShell";
import {
  Tag,
  capexStatusTone,
  timingViewTone,
} from "./StatusTag";
import { downloadCsv, fmtCr, pct } from "../utils/format";

type Props = { company: Company };

export function CapexTracker({ company }: Props) {
  const projects = company.capex;
  const total = projects.reduce((a, p) => a + p.capexRsCr, 0);

  const sumBy = (pred: (s: string) => boolean) =>
    projects.filter((p) => pred(p.status)).reduce((a, p) => a + p.capexRsCr, 0);

  const executing = sumBy((s) => s === "Executing");
  const operational = sumBy((s) => s === "Operational");
  const pipeline = sumBy((s) => s === "Planning" || s === "Feasibility");
  const risk = sumBy((s) => s === "Delayed" || s === "Uncertain");

  const executingPct = pct(executing, total);
  const operationalPct = pct(operational, total);
  const pipelinePct = pct(pipeline, total);
  const riskPct = pct(risk, total);

  const coreCapex = projects
    .filter((p) => p.core)
    .reduce((a, p) => a + p.capexRsCr, 0);
  const adjacentCapex = total - coreCapex;
  const nearTerm = projects
    .filter(
      (p) =>
        p.status === "Operational" ||
        (p.status === "Executing" && p.timingView === "Near-term"),
    )
    .reduce((a, p) => a + p.capexRsCr, 0);
  const longTerm = total - nearTerm;

  const topTwo = [...projects]
    .sort((a, b) => b.capexRsCr - a.capexRsCr)
    .slice(0, 2);
  const unclearCount = projects.filter((p) => p.timingView === "Unclear").length;

  const handleExport = () => {
    const rows: (string | number)[][] = [
      [
        "Project",
        "Segment",
        "Capex (Rs cr)",
        "Current timeline note",
        "Current status",
        "Latest timing view",
        "Capacity addition",
      ],
      ...projects.map((p) => [
        p.project,
        p.segment,
        p.capexRsCr,
        p.timelineNote,
        p.status,
        p.timingView,
        p.capacityAddition,
      ]),
    ];
    downloadCsv(`${company.ticker}-capex-tracker.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Total Capex"
          value={fmtCr(total)}
          subtext="Based on disclosed projects"
          tone="neutral"
        />
        <KpiCard
          label="Under Execution"
          value={`${executingPct}%`}
          subtext="% of total capex"
          tone="amber"
        />
        <KpiCard
          label="Operational"
          value={`${operationalPct}%`}
          subtext="% of total capex"
          tone="green"
        />
        <KpiCard
          label="Pipeline"
          value={`${pipelinePct}%`}
          subtext="Planning + Feasibility"
          tone="grey"
        />
        <KpiCard
          label="Execution Risk"
          value={`${riskPct}%`}
          subtext="Delayed / Uncertain"
          tone="red"
        />
      </div>

      <TableShell
        title="Capex project tracker"
        subtitle="Project amounts stay at the last disclosed number. Status text is refreshed to the latest company update where available."
        onExport={handleExport}
      >
        <table className="w-full min-w-[1024px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-500">
              <th className="border-b border-divider px-6 py-3 font-medium">
                Project
              </th>
              <th className="border-b border-divider px-4 py-3 font-medium">
                Segment
              </th>
              <th className="border-b border-divider px-4 py-3 font-medium text-right">
                Capex (Rs cr)
              </th>
              <th className="border-b border-divider px-4 py-3 font-medium">
                Current timeline note
              </th>
              <th className="border-b border-divider px-4 py-3 font-medium">
                Current status
              </th>
              <th className="border-b border-divider px-4 py-3 font-medium">
                Latest timing view
              </th>
              <th className="border-b border-divider px-6 py-3 font-medium">
                Capacity addition
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr
                key={p.id}
                className="transition-colors hover:bg-ink-100/40 align-top"
              >
                <td className="border-b border-divider px-6 py-4">
                  <div className="font-medium text-ink-900 leading-snug">
                    {p.project}
                  </div>
                </td>
                <td className="border-b border-divider px-4 py-4 text-ink-700 whitespace-nowrap">
                  {p.segment}
                </td>
                <td className="border-b border-divider px-4 py-4 text-right font-medium text-ink-900 whitespace-nowrap tabular-nums">
                  {p.capexRsCr.toLocaleString("en-IN")}
                </td>
                <td className="border-b border-divider px-4 py-4 text-ink-500 leading-relaxed max-w-[280px]">
                  {p.timelineNote}
                </td>
                <td className="border-b border-divider px-4 py-4">
                  <Tag tone={capexStatusTone(p.status)}>{p.status}</Tag>
                </td>
                <td className="border-b border-divider px-4 py-4">
                  <Tag tone={timingViewTone(p.timingView)}>{p.timingView}</Tag>
                </td>
                <td className="border-b border-divider px-6 py-4 text-ink-700 leading-relaxed max-w-[220px]">
                  {p.capacityAddition}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <InsightCard label="Capex Mix · Core vs Adjacent">
          <InsightRow
            a="Core"
            av={`${pct(coreCapex, total)}%`}
            b="Adjacent"
            bv={`${pct(adjacentCapex, total)}%`}
          />
        </InsightCard>
        <InsightCard label="Near-term vs Long-term">
          <InsightRow
            a="Near-term"
            av={`${pct(nearTerm, total)}%`}
            b="Long-term"
            bv={`${pct(longTerm, total)}%`}
          />
          <p className="mt-2 text-xs text-ink-400">
            Operational + near-term executing vs early-stage
          </p>
        </InsightCard>
        <InsightCard label="Top 2 projects by capex">
          <ul className="space-y-2 text-sm">
            {topTwo.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3"
              >
                <span className="text-ink-700 leading-snug">{p.project}</span>
                <span className="shrink-0 font-medium text-ink-900 tabular-nums">
                  {fmtCr(p.capexRsCr)}
                </span>
              </li>
            ))}
          </ul>
        </InsightCard>
        <InsightCard label="Projects with unclear timelines">
          <div className="text-[26px] font-semibold leading-none tracking-tight text-ink-900">
            {unclearCount}
          </div>
          <p className="mt-2 text-xs text-ink-500">
            Announced but no reaffirmed commissioning window
          </p>
        </InsightCard>
      </section>
    </div>
  );
}

function InsightCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl2 bg-surface p-5 shadow-card">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
        {label}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function InsightRow({
  a,
  av,
  b,
  bv,
}: {
  a: string;
  av: string;
  b: string;
  bv: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <div className="text-xs text-ink-500">{a}</div>
        <div className="text-[22px] font-semibold text-ink-900 tabular-nums">
          {av}
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-ink-500">{b}</div>
        <div className="text-[22px] font-semibold text-ink-900 tabular-nums">
          {bv}
        </div>
      </div>
    </div>
  );
}
