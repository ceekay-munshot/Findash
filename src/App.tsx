import { useMemo, useState } from "react";
import { SearchBar } from "./components/SearchBar";
import { CompanyHeader } from "./components/CompanyHeader";
import { Tabs } from "./components/Tabs";
import { CapexTracker } from "./components/CapexTracker";
import { SubsidiaryTracker } from "./components/SubsidiaryTracker";
import { MunsChat } from "./components/MunsChat";
import { findCompany } from "./data/companies";
import type { CapexProject, Company } from "./types";
import {
  CAPEX_TABLE_PROMPT,
  callMunsChat,
  cleanMunsRaw,
  extractFirstTable,
  toCapexProjects,
} from "./utils/muns";

const TABS = [
  { id: "capex", label: "Capex Tracker" },
  { id: "subs", label: "Subsidiary & Future Upside" },
  { id: "chat", label: "MUNS Chat" },
];

function App() {
  const [companyName, setCompanyName] = useState("Reliance Industries Ltd.");
  const [ticker, setTicker] = useState("RELIANCE");
  const [active, setActive] = useState("capex");

  const [liveCapex, setLiveCapex] = useState<CapexProject[] | null>(null);
  const [capexLoading, setCapexLoading] = useState(false);
  const [capexError, setCapexError] = useState<string | null>(null);

  const baseCompany = useMemo(
    () => findCompany(companyName) || findCompany(ticker),
    [companyName, ticker],
  );

  const displayCompany: Company = useMemo(() => {
    const nameTrimmed = companyName.trim() || baseCompany.name;
    const tickerTrimmed = ticker.trim().toUpperCase() || baseCompany.ticker;
    if (liveCapex) {
      return {
        id: baseCompany.id,
        name: nameTrimmed,
        ticker: tickerTrimmed,
        sector: baseCompany.sector,
        capex: liveCapex,
        subsidiaries: baseCompany.subsidiaries,
      };
    }
    return {
      ...baseCompany,
      name: nameTrimmed,
      ticker: tickerTrimmed,
    };
  }, [baseCompany, companyName, ticker, liveCapex]);

  const handleSearch = async ({
    companyName: nextName,
    ticker: nextTicker,
  }: {
    companyName: string;
    ticker: string;
  }) => {
    setCompanyName(nextName);
    setTicker(nextTicker);
    setActive("capex");
    setCapexLoading(true);
    setCapexError(null);
    setLiveCapex(null);

    try {
      const raw = await callMunsChat({
        tasks: [CAPEX_TABLE_PROMPT],
        tickerSymbol: nextTicker,
        contextCompanyName: nextName,
        countries: ["India"],
      });
      const cleaned = cleanMunsRaw(raw);
      const table = extractFirstTable(cleaned);
      if (!table) {
        setCapexError("No project table found in the response.");
        return;
      }
      const projects = toCapexProjects(table);
      if (projects.length === 0) {
        setCapexError("Project table was empty.");
        return;
      }
      setLiveCapex(projects);
    } catch (e) {
      setCapexError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setCapexLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto w-full max-w-content px-5 pb-20 sm:px-8">
        <div className="pt-8">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
            Findash · Company Dashboard
          </div>
          <div className="mt-4">
            <SearchBar
              companyName={companyName}
              ticker={ticker}
              disabled={capexLoading}
              onSubmit={handleSearch}
            />
          </div>
        </div>

        <CompanyHeader company={displayCompany} />

        <div className="mt-6">
          <Tabs tabs={TABS} active={active} onChange={setActive} />
        </div>

        <div className="mt-6">
          {active === "capex" && (
            <CapexTrackerView
              company={displayCompany}
              loading={capexLoading}
              error={capexError}
              live={Boolean(liveCapex)}
            />
          )}
          {active === "subs" && <SubsidiaryTracker company={displayCompany} />}
          {active === "chat" && <MunsChat />}
        </div>

        <footer className="mt-16 border-t border-divider pt-6 text-xs text-ink-400">
          Figures and project statuses are mock data for demonstration. Sources:
          company disclosures, annual reports, investor presentations.
        </footer>
      </div>
    </div>
  );
}

function CapexTrackerView({
  company,
  loading,
  error,
  live,
}: {
  company: Company;
  loading: boolean;
  error: string | null;
  live: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-xl2 border border-divider bg-surface p-10 text-center shadow-card">
        <div className="mx-auto inline-flex items-center gap-3 text-sm text-ink-500">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="3"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          Fetching latest project status for {company.name} ({company.ticker})…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl2 border border-accent-red/30 bg-accent-redSoft p-6 text-sm text-accent-red">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {live && (
        <div className="inline-flex items-center gap-2 rounded-full border border-divider bg-surface px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500 shadow-soft">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent-green" />
          Live — MUNS
        </div>
      )}
      <CapexTracker company={company} />
    </div>
  );
}

export default App;
