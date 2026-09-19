import { useEffect, useState } from "react";
import { Download, FileText, Share2 } from "lucide-react";
import { downloadReportPdf } from "@/lib/reportPdf";
import { downloadSessionsCsv } from "@/lib/reportCsv";
import { getReportData, getWeeklyHistory } from "@/lib/historyRepo";
import { useNeuroGrip } from "@/hooks/NeuroGripProvider";
import PatientNameDialog from "@/components/PatientNameDialog";
import PeriodNav from "./PeriodNav";

const PATIENT_NAME_KEY = "neurogrip-patient-name";

export default function ExportSection() {
  const { config } = useNeuroGrip();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [week, setWeek] = useState(null);
  const [askName, setAskName] = useState(false);

  useEffect(() => {
    let alive = true;
    getWeeklyHistory(weekOffset)
      .then((w) => {
        if (alive) setWeek(w);
      })
      .catch((err) => console.error("Gagal memuat label minggu:", err));
    return () => {
      alive = false;
    };
  }, [weekOffset]);

  function handlePdf() {
    if (!(localStorage.getItem(PATIENT_NAME_KEY) ?? "").trim()) {
      setAskName(true);
      return;
    }
    generatePdf();
  }

  function handleNameConfirm(name) {
    try {
      localStorage.setItem(PATIENT_NAME_KEY, name);
    } catch (err) {
      console.error("Gagal menyimpan nama pasien:", err);
    }
    setAskName(false);
    generatePdf(name);
  }

  async function generatePdf(name) {
    setBusy("pdf");
    setError(null);
    try {
      const patientName = name ?? localStorage.getItem(PATIENT_NAME_KEY) ?? "";
      await downloadReportPdf(weekOffset, { patientName, config, preloadedWeek: week });
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

  async function handleShareWhatsapp() {
    setBusy("whatsapp");
    setError(null);
    try {
      const report = await getReportData();
      const text =
        `Laporan NeuroGrip (${report.generatedAtLabel})\n` +
        `Minggu ini: ${report.week.sessionsThisWeek} sesi, rata-rata ${report.week.avgGrip} g\n` +
        `Bulan ini: ${report.month.sessionsThisMonth} sesi, rata-rata ${report.month.avgGrip} g`;
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (err) {
      console.error("Gagal membagikan ke WhatsApp:", err);
      setError("Gagal menyiapkan ringkasan untuk WhatsApp. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">
        Laporan penggunaan alat
      </h2>
      <p className="mt-1 text-base text-muted-foreground">
        PDF berisi ringkasan minggu yang dipilih & bulanan (dibandingkan
        periode sebelumnya). CSV berisi seluruh riwayat sesi mentah.
      </p>

      <PeriodNav
        className="mt-4"
        label={week?.weekLabel ?? "Memuat…"}
        onPrev={() => setWeekOffset((o) => o - 1)}
        onNext={() => setWeekOffset((o) => o + 1)}
        canNext={week?.canGoNext ?? false}
        prevLabel="Minggu sebelumnya"
        nextLabel="Minggu berikutnya"
      />

      {error && (
        <p className="mt-2 text-base font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary
                     text-base font-bold text-primary-foreground transition hover:bg-primary/90
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
                     border-primary text-base font-bold text-primary transition hover:bg-primary/5
                     disabled:opacity-60"
        >
          <Download className="size-4" />
          {busy === "csv" ? "Membuat CSV…" : "Unduh CSV"}
        </button>
      </div>

      <button
        type="button"
        onClick={handleShareWhatsapp}
        disabled={busy !== null}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2
                   border-success text-base font-bold text-success transition hover:bg-success/5
                   disabled:opacity-60"
      >
        <Share2 className="size-4" />
        {busy === "whatsapp" ? "Menyiapkan…" : "Bagikan ringkasan ke WhatsApp"}
      </button>

      <PatientNameDialog
        open={askName}
        onConfirm={handleNameConfirm}
        onCancel={() => setAskName(false)}
      />
    </section>
  );
}
