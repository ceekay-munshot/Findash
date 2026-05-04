import { useMemo, useState } from "react";
import { SearchBar } from "./components/SearchBar";
import { CompanyHeader } from "./components/CompanyHeader";
import { Tabs } from "./components/Tabs";
import { CapexTracker } from "./components/CapexTracker";
import { SubsidiaryTracker } from "./components/SubsidiaryTracker";
import { findCompany } from "./data/companies";
import type { CapexProject, Company, Subsidiary } from "./types";
import {
  CAPEX_TABLE_PROMPT,
  SUBSIDIARY_TABLE_PROMPT,
  callMunsChat,
  cleanMunsRaw,
  extractFirstTable,
  toCapexProjects,
  toSubsidiaries,
} from "./utils/muns";

const TABS = [
  { id: "capex", label: "Capex Tracker" },
  { id: "subs", label: "Subsidiary & Future Upside" },
];

function App() {
  const [companyName, setCompanyName] = useState("Reliance Industries Ltd.");
  const [ticker, setTicker] = useState("RELIANCE");
  const [active, setActive] = useState("capex");

  const [liveCapex, setLiveCapex] = useState<CapexProject[] | null>(null);
  const [capexLoading, setCapexLoading] = useState(false);
  const [capexError, setCapexError] = useState<string | null>(null);

  const [liveSubs, setLiveSubs] = useState<Subsidiary[] | null>(null);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsError, setSubsError] = useState<string | null>(null);

  const baseCompany = useMemo(
    () => findCompany(companyName) || findCompany(ticker),
    [companyName, ticker],
  );

  const displayCompany: Company = useMemo(() => {
    const nameTrimmed = companyName.trim() || baseCompany.name;
    const tickerTrimmed = ticker.trim().toUpperCase() || baseCompany.ticker;
    return {
      id: baseCompany.id,
      name: nameTrimmed,
      ticker: tickerTrimmed,
      sector: baseCompany.sector,
      capex: liveCapex ?? baseCompany.capex,
      subsidiaries: liveSubs ?? baseCompany.subsidiaries,
    };
  }, [baseCompany, companyName, ticker, liveCapex, liveSubs]);

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

    setSubsLoading(true);
    setSubsError(null);
    setLiveSubs(null);

    const fetchTable = (prompt: string) =>
      callMunsChat({
        tasks: [prompt],
        tickerSymbol: nextTicker,
        contextCompanyName: nextName,
        countries: ["India"],
      });

    const capexPromise = fetchTable(CAPEX_TABLE_PROMPT)
      .then((raw) => {
        const table = extractFirstTable(cleanMunsRaw(raw));
        if (!table) throw new Error("No project table found in the response.");
        const projects = toCapexProjects(table);
        if (projects.length === 0) throw new Error("Project table was empty.");
        setLiveCapex(projects);
      })
      .catch((e: unknown) => {
        setCapexError(e instanceof Error ? e.message : "Unexpected error");
      })
      .finally(() => setCapexLoading(false));

    const subsPromise = fetchTable(SUBSIDIARY_TABLE_PROMPT)
      .then((raw) => {
        const table = extractFirstTable(cleanMunsRaw(raw));
        if (!table) throw new Error("No subsidiary table found in the response.");
        const subsidiaries = toSubsidiaries(table);
        if (subsidiaries.length === 0) throw new Error("Subsidiary table was empty.");
        setLiveSubs(subsidiaries);
      })
      .catch((e: unknown) => {
        setSubsError(e instanceof Error ? e.message : "Unexpected error");
      })
      .finally(() => setSubsLoading(false));

    await Promise.all([capexPromise, subsPromise]);
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
              disabled={capexLoading || subsLoading}
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
          {active === "subs" && (
            <SubsidiaryTrackerView
              company={displayCompany}
              loading={subsLoading}
              error={subsError}
              live={Boolean(liveSubs)}
            />
          )}
        </div>

        <footer className="mt-16 border-t border-divider pt-6 text-xs text-ink-400">
          Figures and project statuses are mock data for demonstration. Sources:
          company disclosures, annual reports, investor presentations.
        </footer>
      </div>
    </div>
  );
}

function FetchSpinner({ message }: { message: string }) {
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
        {message}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl2 border border-accent-red/30 bg-accent-redSoft p-6 text-sm text-accent-red">
      {message}
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-divider bg-surface px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500 shadow-soft">
      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent-green" />
      Live — MUNS
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
      <FetchSpinner
        message={`Fetching latest project status for ${company.name} (${company.ticker})…`}
      />
    );
  }
  if (error) return <ErrorBanner message={error} />;
  return (
    <div className="space-y-4">
      {live && <LiveBadge />}
      <CapexTracker company={company} />
    </div>
  );
}

function SubsidiaryTrackerView({
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
      <FetchSpinner
        message={`Fetching latest subsidiary structure for ${company.name} (${company.ticker})…`}
      />
    );
  }
  if (error) return <ErrorBanner message={error} />;
  return (
    <div className="space-y-4">
      {live && <LiveBadge />}
      <SubsidiaryTracker company={company} />
    </div>
  );
}

export default App;
