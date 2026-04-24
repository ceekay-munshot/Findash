import { useMemo, useState } from "react";
import { SearchBar } from "./components/SearchBar";
import { CompanyHeader } from "./components/CompanyHeader";
import { Tabs } from "./components/Tabs";
import { CapexTracker } from "./components/CapexTracker";
import { SubsidiaryTracker } from "./components/SubsidiaryTracker";
import { MunsChat } from "./components/MunsChat";
import { findCompany } from "./data/companies";

const TABS = [
  { id: "capex", label: "Capex Tracker" },
  { id: "subs", label: "Subsidiary & Future Upside" },
  { id: "chat", label: "MUNS Chat" },
];

function App() {
  const [query, setQuery] = useState("Reliance");
  const [active, setActive] = useState("capex");

  const company = useMemo(() => findCompany(query), [query]);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto w-full max-w-content px-5 pb-20 sm:px-8">
        <div className="pt-8">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
            Findash · Company Dashboard
          </div>
          <div className="mt-4 max-w-2xl">
            <SearchBar value={query} onSubmit={setQuery} />
          </div>
        </div>

        <CompanyHeader company={company} />

        <div className="mt-6">
          <Tabs tabs={TABS} active={active} onChange={setActive} />
        </div>

        <div className="mt-6">
          {active === "capex" && <CapexTracker company={company} />}
          {active === "subs" && <SubsidiaryTracker company={company} />}
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

export default App;
