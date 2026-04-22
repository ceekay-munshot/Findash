import type { CapexStatus, SubsidiaryStatus, RevenueStage, TimingView } from "../types";

type Tone = "green" | "amber" | "grey" | "red" | "slate" | "neutral";

const toneClass: Record<Tone, string> = {
  green: "bg-accent-greenSoft text-accent-green",
  amber: "bg-accent-amberSoft text-accent-amber",
  grey: "bg-ink-100 text-ink-500",
  red: "bg-accent-redSoft text-accent-red",
  slate: "bg-accent-slateSoft text-accent-slate",
  neutral: "bg-ink-100 text-ink-700",
};

export function capexStatusTone(s: CapexStatus): Tone {
  switch (s) {
    case "Operational":
      return "green";
    case "Executing":
      return "amber";
    case "Planning":
    case "Feasibility":
      return "grey";
    case "Delayed":
    case "Uncertain":
      return "red";
  }
}

export function subsidiaryStatusTone(s: SubsidiaryStatus): Tone {
  switch (s) {
    case "Operating":
      return "green";
    case "Early":
      return "amber";
    case "Optionality":
      return "slate";
    case "Holding structure":
      return "grey";
  }
}

export function revenueStageTone(s: RevenueStage): Tone {
  switch (s) {
    case "Revenue-generating":
      return "green";
    case "Pilot":
      return "amber";
    case "Pre-revenue":
      return "slate";
    case "Dormant":
      return "grey";
  }
}

export function timingViewTone(t: TimingView): Tone {
  switch (t) {
    case "Near-term":
      return "green";
    case "Medium-term":
      return "amber";
    case "Long-term":
      return "slate";
    case "Unclear":
      return "grey";
  }
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
