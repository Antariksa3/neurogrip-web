import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { getTodayProgress } from "@/lib/historyRepo";

export default function ProgressSummary() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    getTodayProgress()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((err) => {
        console.error("Gagal memuat ringkasan progres:", err);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!data?.hasData) return null;

  const { sessionsToday, avgToday, hasYesterdayData, changePercent } = data;
  const improved = changePercent > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[14px] text-muted-foreground">Progres hari ini</p>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-lg font-bold text-foreground">
          {sessionsToday} sesi · rata-rata {avgToday} g
        </p>
        {hasYesterdayData && changePercent !== 0 && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold ${
              improved
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {improved ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {improved ? "+" : ""}
            {changePercent}% dari kemarin
          </span>
        )}
      </div>
    </div>
  );
}
