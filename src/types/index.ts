export type CapexStatus =
  | "Operational"
  | "Executing"
  | "Planning"
  | "Feasibility"
  | "Delayed"
  | "Uncertain";

export type TimingView = "Near-term" | "Medium-term" | "Long-term" | "Unclear";

export type CapexProject = {
  id: string;
  project: string;
  segment: string;
  capexRsCr: number;
  timelineNote: string;
  status: CapexStatus;
  timingView: TimingView;
  capacityAddition: string;
  core?: boolean;
};

export type SubsidiaryStatus =
  | "Operating"
  | "Early"
  | "Optionality"
  | "Holding structure";

export type RevenueStage =
  | "Revenue-generating"
  | "Pre-revenue"
  | "Pilot"
  | "Dormant";

export type Subsidiary = {
  id: string;
  name: string;
  business: string;
  stake: string;
  status: SubsidiaryStatus;
  revenueStage: RevenueStage;
  strategicLink: string;
  wholly?: boolean;
  strategicAdjacency?: boolean;
  keyEntity?: boolean;
  grouping: "Core Earnings" | "Forward Integration" | "Adjacent / Optional";
};

export type Company = {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  capex: CapexProject[];
  subsidiaries: Subsidiary[];
};
