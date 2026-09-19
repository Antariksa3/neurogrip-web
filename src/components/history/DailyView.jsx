import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { getDaySessions } from "@/lib/history/historyRepo";
import ErrorCard from "@/components/feedback/ErrorCard";
import PeriodNav from "@/components/history/PeriodNav";
import HistorySkeleton from "@/components/history/HistorySkeleton";

export default function DailyView() {
  const [dayOffset, setDayOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getDaySessions(dayOffset)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((err) => {
        console.error("Gagal memuat sesi harian:", err);
        if (alive) setError("Gagal memuat sesi harian. Coba lagi.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [dayOffset, retryTick]);

  const sessions = data?.sessions ?? [];

  return (
    <div className="space-y-4">
      <PeriodNav
        label={
          data
            ? data.isToday
              ? `Hari ini, ${data.dayLabel}`
              : data.dayLabel
            : "Memuat…"
        }
        onPrev={() => setDayOffset((o) => o - 1)}
        onNext={() => setDayOffset((o) => o + 1)}
        canNext={data?.canGoNext ?? false}
        prevLabel="Hari sebelumnya"
        nextLabel="Hari berikutnya"
      />

      {loading && !data ? (
        <HistorySkeleton compact />
      ) : error && !data ? (
        <ErrorCard
          icon={<TriangleAlert className="size-7 text-destructive" />}
          title="Gagal memuat data"
          message={error}
          onRetry={() => setRetryTick((t) => t + 1)}
        />
      ) : sessions.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-base text-muted-foreground">
            Belum ada sesi latihan {data?.isToday ? "hari ini" : "pada hari itu"}.
          </p>
        </section>
      ) : (
        <ul className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-foreground">
                  Pukul {s.time}
                </p>
                <p className="text-base text-muted-foreground">
                  {s.durationLabel}
                </p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-base text-muted-foreground">
                    Rata-rata
                  </p>
                  <p className="text-lg font-bold tabular-nums text-foreground">
                    {s.avgForce} g
                  </p>
                </div>
                <div>
                  <p className="text-base text-muted-foreground">Puncak</p>
                  <p className="text-lg font-bold tabular-nums text-foreground">
                    {s.peakForce} g
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
