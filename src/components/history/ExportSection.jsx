import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { downloadReportPdf } from "@/lib/reportPdf";
import { downloadSessionsCsv } from "@/lib/reportCsv";

export default function ExportSection() {
  const [busy, setBusy] = useState(null);
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
