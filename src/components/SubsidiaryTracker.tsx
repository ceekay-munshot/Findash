import type { Company } from "../types";
import { KpiCard } from "./KpiCard";
import { TableShell } from "./TableShell";
import {
  Tag,
  revenueStageTone,
  subsidiaryStatusTone,
} from "./StatusTag";
import { downloadCsv, pct } from "../utils/format";

type Props = { company: Company };

export function SubsidiaryTracker({ company }: Props) {
  const subs = company.subsidiaries;
  const total = subs.length;
  const wholly = subs.filter((s) => s.wholly).length;
  const revenueGen = subs.filter((s) => s.revenueStage === "Revenue-generating").length;
  const optionality = subs.filter(
    (s) => s.revenueStage === "Pre-revenue" || s.revenueStage === "Pilot",
  ).length;
  const strategicAdjacency = subs.filter((s) => s.strategicAdjacency).length;

  const core = subs.filter((s) => s.grouping === "Core Earnings");
  const forward = subs.filter((s) => s.grouping === "Forward Integration");
  const adjacent = subs.filter((s) => s.grouping === "Adjacent / Optional");

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ["Name", "Business", "Stake", "Status", "Revenue stage", "Strategic link"],
      ...subs.map((s) => [
        s.name,
        s.business,
        s.stake,
        s.status,
        s.revenueStage,
        s.strategicLink,
      ]),
    ];
    downloadCsv(`${company.ticker}-subsidiaries.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Total Subsidiaries"
          value={String(total)}
          subtext="Disclosed entities in scope"
          tone="neutral"
        />
        <KpiCard
          label="Wholly Owned"
          value={`${pct(wholly, total)}%`}
          subtext={`${wholly} of ${total} entities`}
          tone="slate"
        />
        <KpiCard
          label="Revenue-generating"
          value={String(revenueGen)}
          subtext="Entities with active revenue"
          tone="green"
        />
        <KpiCard
          label="Optionality / Pre-revenue"
          value={String(optionality)}
          subtext="Pre-revenue & pilot stage"
          tone="amber"
        />
        <KpiCard
          label="Strategic Adjacency"
          value={`${pct(strategicAdjacency, total)}%`}
          subtext="% of entities in adjacencies"
          tone="slate"
        />
      </div>

      <TableShell
        title="Subsidiary and future upside tracker"
        subtitle="Strategic adjacencies stay visible but are not confused with current operating earnings."
        onExport={handleExport}
      >
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-500">
              <th className="border-b border-divider px-6 py-3 font-medium">
                Name
              </th>
              <th className="border-b border-divider px-4 py-3 font-medium">
                Business
              </th>
              <th className="border-b border-divider px-4 py-3 font-medium whitespace-nowrap">
                Stake
              </th>
              <th className="border-b border-divider px-4 py-3 font-medium">
                Status
              </th>
              <th className="border-b border-divider px-4 py-3 font-medium">
                Revenue stage
              </th>
              <th className="border-b border-divider px-6 py-3 font-medium">
                Strategic link
              </th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr
                key={s.id}
                className="transition-colors hover:bg-ink-100/40 align-top"
              >
                <td className="border-b border-divider px-6 py-4">
                  <div
                    className={[
                      "leading-snug",
                      s.keyEntity
                        ? "font-semibold text-ink-900"
                        : "font-medium text-ink-900",
                    ].join(" ")}
                  >
                    {s.name}
                  </div>
                </td>
                <td className="border-b border-divider px-4 py-4 text-ink-700 leading-relaxed max-w-[260px]">
                  {s.business}
                </td>
                <td className="border-b border-divider px-4 py-4 text-ink-700 whitespace-nowrap tabular-nums">
                  {s.stake}
                </td>
                <td className="border-b border-divider px-4 py-4">
                  <Tag tone={subsidiaryStatusTone(s.status)}>{s.status}</Tag>
                </td>
                <td className="border-b border-divider px-4 py-4">
                  <Tag tone={revenueStageTone(s.revenueStage)}>
                    {s.revenueStage}
                  </Tag>
                </td>
                <td className="border-b border-divider px-6 py-4 text-ink-500 leading-relaxed max-w-[280px]">
                  {s.strategicLink}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <section className="grid gap-3 lg:grid-cols-3">
        <GroupCard
          title="Core Earnings Entities"
          caption="Entities contributing to near-term earnings"
          names={core.map((s) => s.name)}
          tone="green"
        />
        <GroupCard
          title="Forward Integration Plays"
          caption="Building blocks for adjacent value chains"
          names={forward.map((s) => s.name)}
          tone="amber"
        />
        <GroupCard
          title="Adjacent / Optional Bets"
          caption="Entities with long-term optionality"
          names={adjacent.map((s) => s.name)}
          tone="slate"
        />
      </section>
    </div>
  );
}

function GroupCard({
  title,
  caption,
  names,
  tone,
}: {
  title: string;
  caption: string;
  names: string[];
  tone: "green" | "amber" | "slate";
}) {
  const dot = {
    green: "bg-accent-green",
    amber: "bg-accent-amber",
    slate: "bg-accent-slate",
  }[tone];

  return (
    <div className="rounded-xl2 bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
          {title}
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-400">{caption}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
        {names.length === 0 ? (
          <li className="text-ink-400">No entities in this group</li>
        ) : (
          names.map((n) => (
            <li
              key={n}
              className="flex items-start gap-2 leading-snug"
            >
              <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-ink-300 shrink-0" />
              <span>{n}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
