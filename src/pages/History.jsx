import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TriangleAlert } from "lucide-react";
import { useNeuroGrip } from "@/hooks/NeuroGripProvider";
import { AUTO_STOP_WEEKLY_LIMIT } from "@/lib/bleContract";
import HistoryChart from "@/components/HistoryChart";

export default function History() {
  const { history, historyLoading, loadHistory } = useNeuroGrip();
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const autoStops = history?.autoStops ?? [];
  const needsCalibration = autoStops.length >= AUTO_STOP_WEEKLY_LIMIT;

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

      <div className="space-y-4 px-5 py-5 md:px-8 lg:px-10">
        {historyLoading && !history ? (
          <Skeleton />
        ) : (
          <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-4 lg:space-y-0 space-y-4">
            <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
              {typeof history?.changePercent === "number" &&
                history.changePercent !== 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-success/10
                               px-3 py-1 text-[13px] font-semibold text-success"
                  >
                    <TrendingUp className="size-3.5" />
                    {history.changePercent > 0 ? "+" : ""}
                    {history.changePercent}% dari minggu lalu
                  </span>
                )}

              <h2 className="mt-4 text-[15px] font-semibold text-foreground">
                Kekuatan genggaman per sesi
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                7 hari terakhir, dalam gram
              </p>

              <div className="mt-2">
                <HistoryChart data={history?.weeklyGrip} />
              </div>
            </section>

            <div className="space-y-4 lg:col-span-1">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Sesi latihan minggu ini"
                  value={history?.sessionsThisWeek ?? 0}
                />
                <StatCard
                  label="Rata-rata genggaman"
                  value={history?.avgGrip ?? 0}
                  unit="g"
                />
              </div>

              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-[15px] font-semibold text-foreground">
                  Riwayat berhenti otomatis
                </h2>

                {autoStops.length === 0 ? (
                  <p className="mt-3 text-[15px] text-muted-foreground">
                    Belum ada. Genggaman Anda selalu dalam batas aman.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {autoStops.map((item) => (
                      <li
                        key={`${item.date}-${item.time}`}
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
                  className="rounded-2xl border border-warning bg-warning/10 p-5"
                  role="status"
                >
                  <p className="text-[15px] leading-relaxed text-foreground">
                    Alat berhenti otomatis {autoStops.length} kali minggu ini.
                    Batas tekanan mungkin terlalu rendah untuk genggaman Anda.
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[15px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
        {value}
        {unit && (
          <span className="ml-1 text-base font-semibold text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
