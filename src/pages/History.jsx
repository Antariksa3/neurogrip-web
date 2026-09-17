import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import WeeklyView from "@/components/history/WeeklyView";
import DailyView from "@/components/history/DailyView";
import ExportSection from "@/components/history/ExportSection";

const TABS = [
  { id: "minggu", label: "Per Minggu" },
  { id: "hari", label: "Per Hari" },
];

export default function History() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("minggu");

  return (
    <div className="flex-1 bg-background">
      <header className="flex items-center gap-3 bg-primary px-4 py-4 md:px-8 lg:px-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="grid size-11 shrink-0 place-items-center rounded-xl
                     text-white transition hover:bg-white/15"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-bold text-white">Riwayat sensor</h1>
      </header>

      <div className="flex gap-2 px-5 pt-4 md:px-8 lg:px-10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`h-10 flex-1 rounded-xl text-[14px] font-semibold transition md:flex-none md:px-8 ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 py-5 md:px-8 lg:px-10">
        {tab === "minggu" ? <WeeklyView navigate={navigate} /> : <DailyView />}
      </div>

      <div className="px-5 pb-8 md:px-8 md:pb-10 lg:px-10">
        <ExportSection />
      </div>
    </div>
  );
}
