import { getAllSessionsForExport } from "@/lib/history/historyRepo";

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows) {
  const header = ["Tanggal", "Jam", "Durasi", "Rata-rata (g)", "Puncak (g)"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [row.tanggal, row.jam, row.durasi, row.rataRataGram, row.puncakGram]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  return lines.join("\n");
}

// Membuat & langsung mengunduh seluruh riwayat sesi latihan sebagai CSV.
export async function downloadSessionsCsv() {
  const rows = await getAllSessionsForExport();
  const csv = toCsv(rows);

  // BOM di depan supaya Excel membaca karakter non-ASCII (mis. "–") dengan benar.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const fileDate = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neurogrip-riwayat-sesi-${fileDate}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}