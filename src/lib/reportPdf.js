import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getReportData } from "./historyRepo";

const BRAND_COLOR = [15, 110, 86]; 

function formatPercent(n) {
  if (typeof n !== "number" || n === 0) return "0%";
  return `${n > 0 ? "+" : ""}${n}%`;
}

export async function downloadReportPdf() {
  const { generatedAtLabel, week, month } = await getReportData();

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 14;
  let y = 18;

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("Laporan Penggunaan NeuroGrip", marginX, y);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  y += 7;
  doc.text(`Dibuat pada ${generatedAtLabel}`, marginX, y);

  // Ringkasan mingguan
  y += 10;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Ringkasan mingguan", marginX, y);

  autoTable(doc, {
    startY: y + 4,
    theme: "grid",
    head: [["Periode", "Sesi latihan", "Rata-rata genggaman", "Perubahan", "Auto-stop"]],
    body: [
      [
        week.weekLabel,
        String(week.sessionsThisWeek),
        `${week.avgGrip} g`,
        `${formatPercent(week.changePercent)} dari minggu sebelumnya`,
        String(week.autoStopsThisWeek),
      ],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: BRAND_COLOR },
  });

  // Ringkasan bulanan
  y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Ringkasan bulanan", marginX, y);

  autoTable(doc, {
    startY: y + 4,
    theme: "grid",
    head: [["Periode", "Sesi latihan", "Rata-rata genggaman", "Perubahan", "Auto-stop"]],
    body: [
      [
        month.monthLabel,
        String(month.sessionsThisMonth),
        `${month.avgGrip} g`,
        `${formatPercent(month.changePercent)} dari bulan sebelumnya`,
        String(month.autoStopsThisMonth),
      ],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: BRAND_COLOR },
  });

  // Rincian harian minggu berjalan
  y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(`Kekuatan genggaman per hari (${week.weekLabel})`, marginX, y);

  autoTable(doc, {
    startY: y + 4,
    theme: "grid",
    head: [["Hari", "Rata-rata genggaman (g)"]],
    body: week.weeklyGrip.map((d) => [d.day, d.value > 0 ? String(d.value) : "–"]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: BRAND_COLOR },
  });

  // Riwayat auto-stop minggu berjalan
  y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(`Riwayat berhenti otomatis (${week.weekLabel})`, marginX, y);

  if (week.autoStops.length === 0) {
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text("Tidak ada kejadian berhenti otomatis pada minggu ini.", marginX, y + 6);
  } else {
    autoTable(doc, {
      startY: y + 4,
      theme: "grid",
      head: [["Tanggal", "Jam", "Tekanan (g)"]],
      body: week.autoStops.map((a) => [a.date, a.time, String(a.force)]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: BRAND_COLOR },
    });
  }

  const fileDate = new Date().toISOString().slice(0, 10);
  doc.save(`neurogrip-laporan-${fileDate}.pdf`);
}