import { useEffect, useState } from "react";
import { Flame, TrendingUp, TriangleAlert } from "lucide-react";
import { AUTO_STOP_WEEKLY_LIMIT } from "@/lib/bleContract";
import { getStreak, getWeeklyHistory } from "@/lib/historyRepo";
import HistoryChart from "@/components/HistoryChart";
import ErrorCard from "@/components/ErrorCard";
import StatCard from "@/components/StatCard";
import PeriodNav from "./PeriodNav";
import HistorySkeleton from "./HistorySkeleton";

export default function WeeklyView({ navigate }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    getStreak()
      .then(setStreak)
      .catch((err) => console.error("Gagal memuat streak:", err));
  }, [retryTick]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getWeeklyHistory(weekOffset)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((err) => {
        console.error("Gagal memuat riwayat minggu:", err);
        if (alive) setError("Gagal memuat riwayat minggu. Coba lagi.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [weekOffset, retryTick]);

  const autoStops = data?.autoStops ?? [];
  const autoStopsThisWeek = data?.autoStopsThisWeek ?? 0;
  const needsCalibration = autoStopsThisWeek >= AUTO_STOP_WEEKLY_LIMIT;

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
      <PeriodNav
        className="lg:col-span-2"
        label={data?.weekLabel ?? "Memuat…"}
        onPrev={() => setWeekOffset((o) => o - 1)}
        onNext={() => setWeekOffset((o) => o + 1)}
        canNext={data?.canGoNext ?? false}
        prevLabel="Minggu sebelumnya"
        nextLabel="Minggu berikutnya"
      />

      {streak > 1 && (
        <div
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-warning/10
                     px-3 py-1.5 text-[13px] font-semibold text-warning lg:col-span-2"
        >
          <Flame className="size-4" />
          {streak} hari beruntun latihan
        </div>
      )}

      {loading && !data ? (
        <HistorySkeleton />
      ) : error && !data ? (
        <ErrorCard
          className="lg:col-span-2"
          icon={<TriangleAlert className="size-7 text-destructive" />}
          title="Gagal memuat data"
          message={error}
          onRetry={() => setRetryTick((t) => t + 1)}
        />
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
            {typeof data?.changePercent === "number" &&
              data.changePercent !== 0 && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-success/10
                             px-3 py-1 text-[13px] font-semibold text-success"
                >
                  <TrendingUp className="size-3.5" />
                  {data.changePercent > 0 ? "+" : ""}
                  {data.changePercent}% dari minggu sebelumnya
                </span>
              )}

            <h2 className="mt-4 text-[15px] font-semibold text-foreground">
              Kekuatan genggaman per hari
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {data?.weekLabel ?? "Minggu ini"}, dalam gram
            </p>

            <div className="mt-2">
              <HistoryChart data={data?.weeklyGrip} />
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-4">
            <StatCard
              label={
                data?.isCurrentWeek
                  ? "Sesi latihan minggu ini"
                  : "Sesi latihan minggu itu"
              }
              value={data?.sessionsThisWeek ?? 0}
            />
            <StatCard
              label="Rata-rata genggaman"
              value={data?.avgGrip ?? 0}
              unit="g"
            />
          </div>

          <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
            <h2 className="text-[15px] font-semibold text-foreground">
              Riwayat berhenti otomatis
            </h2>

            {autoStops.length === 0 ? (
              <p className="mt-3 text-[15px] text-muted-foreground">
                Belum ada. Genggaman Anda selalu dalam batas aman.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {autoStops.map((item, i) => (
                  <li
                    key={`${item.date}-${item.time}-${i}`}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-warning/10">
                      <TriangleAlert className="size-4 text-warning" />
                    </span>
                    <div>
                      <p className="text-[15px] font-semibold text-foreground">
                        {item.date}, {item.time}
                      </p>
                      <p className="text-[14px] text-muted-foreground">
                        Tekanan mencapai {item.force} gram
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {needsCalibration && (
            <section
              className="rounded-2xl border border-warning bg-warning/10 p-5 lg:col-span-2"
              role="status"
            >
              <p className="text-[15px] leading-relaxed text-foreground">
                Alat berhenti otomatis {autoStopsThisWeek} kali{" "}
                {data?.isCurrentWeek ? "minggu ini" : "pada minggu itu"}. Batas
                tekanan mungkin terlalu rendah untuk genggaman Anda.
              </p>
              <button
                type="button"
                onClick={() => navigate("/calibration")}
                className="mt-3 min-h-11 font-semibold text-primary underline underline-offset-4"
              >
                Ke kalibrasi sensor
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
