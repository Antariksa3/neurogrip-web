import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getReportData } from "./historyRepo";

const BRAND_COLOR = [15, 110, 86]; 

function formatPercent(n) {
  if (typeof n !== "number" || n === 0) return "0%";
  return `${n > 0 ? "+" : ""}${n}%`;
}

// Render grafik batang harian ke canvas tersembunyi, lalu dipakai sebagai
// gambar di PDF (doc.addImage). Native canvas dipakai (bukan recharts, yang
// SVG-based dan tidak langsung bisa di-toDataURL) supaya tidak perlu
// menambah dependency baru untuk satu grafik statis.
function renderWeeklyGripChart(weeklyGrip) {
  const width = 900;
  const height = 360;
  const paddingLeft = 60;
  const paddingBottom = 50;
  const paddingTop = 20;
  const paddingRight = 20;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const maxValue = Math.max(...weeklyGrip.map((d) => d.value), 1);
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const barSlot = chartWidth / weeklyGrip.length;
  const barWidth = barSlot * 0.5;

  // Sumbu Y + garis grid
  ctx.strokeStyle = "#d4d4d4";
  ctx.fillStyle = "#525252";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const value = Math.round((maxValue / ySteps) * i);
    const yPos = paddingTop + chartHeight - (value / maxValue) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, yPos);
    ctx.lineTo(width - paddingRight, yPos);
    ctx.stroke();
    ctx.fillText(String(value), paddingLeft - 10, yPos);
  }

  // Batang per hari
  ctx.fillStyle = `rgb(${BRAND_COLOR.join(",")})`;
  ctx.textAlign = "center";
  weeklyGrip.forEach((d, i) => {
    const barHeight = (d.value / maxValue) * chartHeight;
    const x = paddingLeft + i * barSlot + (barSlot - barWidth) / 2;
    const yPos = paddingTop + chartHeight - barHeight;
    ctx.fillStyle = `rgb(${BRAND_COLOR.join(",")})`;
    ctx.fillRect(x, yPos, barWidth, barHeight);

    ctx.fillStyle = "#404040";
    ctx.textBaseline = "top";
    ctx.fillText(d.day, x + barWidth / 2, paddingTop + chartHeight + 12);

    if (d.value > 0) {
      ctx.textBaseline = "bottom";
      ctx.fillText(String(d.value), x + barWidth / 2, yPos - 4);
    }
  });

  return canvas.toDataURL("image/png");
}

export async function downloadReportPdf(
  weekOffset = 0,
  { patientName, config, preloadedWeek } = {},
) {
  const { generatedAtLabel, week, month } = await getReportData(weekOffset, preloadedWeek);
  const configLabel =
    config &&
    typeof config.threshold === "number" &&
    typeof config.sensitivity === "number"
      ? `Pengaturan: threshold ${config.threshold}g, sensitivitas ${config.sensitivity}`
      : null;

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

  if (patientName) {
    y += 6;
    doc.text(`Nama pasien: ${patientName}`, marginX, y);
  }

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
      ...(configLabel ? [[{ content: configLabel, colSpan: 5 }]] : []),
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
      ...(configLabel ? [[{ content: configLabel, colSpan: 5 }]] : []),
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

  // Grafik tren genggaman harian
  y = doc.lastAutoTable.finalY + 10;
  const chartWidthMm = 180;
  const chartHeightMm = 72;
  if (y + chartHeightMm > doc.internal.pageSize.getHeight() - 15) {
    doc.addPage();
    y = 18;
  }
  const chartImage = renderWeeklyGripChart(week.weeklyGrip);
  doc.addImage(chartImage, "PNG", marginX, y, chartWidthMm, chartHeightMm);

  // Riwayat auto-stop minggu berjalan
  y = y + chartHeightMm + 10;
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