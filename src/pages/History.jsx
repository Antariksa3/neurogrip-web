import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { AUTO_STOP_WEEKLY_LIMIT } from "@/lib/bleContract";
import { getWeeklyHistory, getDaySessions } from "@/lib/historyRepo";
import { downloadReportPdf } from "@/lib/reportPdf";
import { downloadSessionsCsv } from "@/lib/reportCsv";
import HistoryChart from "@/components/HistoryChart";

const TABS = [
  { id: "minggu", label: "Per Minggu" },
  { id: "hari", label: "Per Hari" },
];

export default function History() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("minggu");

  return (
    <div className="flex-1 bg-background">
      <header className="flex items-center gap-3 bg-primary px-4 py-4">
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

      <div className="flex gap-2 px-5 pt-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`h-10 flex-1 rounded-xl text-[14px] font-semibold transition ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 py-5">
        {tab === "minggu" ? <WeeklyView navigate={navigate} /> : <DailyView />}
      </div>

      <div className="px-5 pb-8">
        <ExportSection />
      </div>
    </div>
  );
}

function WeeklyView({ navigate }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getWeeklyHistory(weekOffset)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((err) => {
        console.error("Gagal memuat riwayat minggu:", err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [weekOffset]);

  const autoStops = data?.autoStops ?? [];
  const autoStopsThisWeek = data?.autoStopsThisWeek ?? 0;
  const needsCalibration = autoStopsThisWeek >= AUTO_STOP_WEEKLY_LIMIT;

  return (
    <div className="space-y-4">
      <PeriodNav
        label={data?.weekLabel ?? "Memuat…"}
        onPrev={() => setWeekOffset((o) => o - 1)}
        onNext={() => setWeekOffset((o) => o + 1)}
        canNext={data?.canGoNext ?? false}
        prevLabel="Minggu sebelumnya"
        nextLabel="Minggu berikutnya"
      />

      {loading && !data ? (
        <Skeleton />
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-card p-5">
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

          <div className="grid grid-cols-2 gap-4">
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
              className="rounded-2xl border border-warning bg-warning/10 p-5"
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

function DailyView() {
  const [dayOffset, setDayOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getDaySessions(dayOffset)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((err) => {
        console.error("Gagal memuat sesi harian:", err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [dayOffset]);

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
        <Skeleton compact />
      ) : sessions.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-[15px] text-muted-foreground">
            Belum ada sesi latihan {data?.isToday ? "hari ini" : "pada hari itu"}.
          </p>
        </section>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold text-foreground">
                  Pukul {s.time}
                </p>
                <p className="text-[14px] text-muted-foreground">
                  {s.durationLabel}
                </p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[13px] text-muted-foreground">
                    Rata-rata
                  </p>
                  <p className="text-lg font-bold tabular-nums text-foreground">
                    {s.avgForce} g
                  </p>
                </div>
                <div>
                  <p className="text-[13px] text-muted-foreground">Puncak</p>
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

function ExportSection() {
  const [busy, setBusy] = useState(null); // "pdf" | "csv" | null
  const [error, setError] = useState(null);

  async function handlePdf() {
    setBusy("pdf");
    setError(null);
    try {
      await downloadReportPdf();
    } catch (err) {
      console.error("Gagal membuat laporan PDF:", err);
      setError("Gagal membuat laporan PDF. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCsv() {
    setBusy("csv");
    setError(null);
    try {
      await downloadSessionsCsv();
    } catch (err) {
      console.error("Gagal membuat file CSV:", err);
      setError("Gagal membuat file CSV. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-[15px] font-semibold text-foreground">
        Laporan penggunaan alat
      </h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        PDF berisi ringkasan mingguan & bulanan (dibandingkan periode
        sebelumnya). CSV berisi seluruh riwayat sesi mentah.
      </p>

      {error && (
        <p className="mt-2 text-[13px] font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary
                     text-[14px] font-bold text-primary-foreground transition hover:bg-primary/90
                     disabled:opacity-60"
        >
          <FileText className="size-4" />
          {busy === "pdf" ? "Membuat PDF…" : "Unduh PDF"}
        </button>
        <button
          type="button"
          onClick={handleCsv}
          disabled={busy !== null}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2
                     border-primary text-[14px] font-bold text-primary transition hover:bg-primary/5
                     disabled:opacity-60"
        >
          <Download className="size-4" />
          {busy === "csv" ? "Membuat CSV…" : "Unduh CSV"}
        </button>
      </div>
    </section>
  );
}

function PeriodNav({ label, onPrev, onNext, canNext, prevLabel, nextLabel }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-2 py-2">
      <button
        type="button"
        onClick={onPrev}
        aria-label={prevLabel}
        className="grid size-10 shrink-0 place-items-center rounded-xl text-foreground
                   transition hover:bg-muted"
      >
        <ChevronLeft className="size-5" />
      </button>
      <span className="text-[15px] font-semibold text-foreground">{label}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label={nextLabel}
        className="grid size-10 shrink-0 place-items-center rounded-xl text-foreground
                   transition hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight className="size-5" />
      </button>
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

function Skeleton({ compact = false }) {
  if (compact) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }
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