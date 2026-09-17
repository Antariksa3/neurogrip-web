import { db } from "./db";

const DAY_LABELS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAY_LABELS_LONG_ID = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
];
const MONTH_LABELS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];
const MONTH_LABELS_LONG_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Senin selalu jadi awal minggu, apapun hari ini sekarang.
function startOfWeek(ts) {
  const d = new Date(startOfDay(ts));
  const day = d.getDay(); // 0=Min, 1=Sen, ..., 6=Sab
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  return d.getTime();
}

function startOfMonth(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d.getTime();
}

function addMonths(ts, n) {
  const d = new Date(ts);
  d.setMonth(d.getMonth() + n);
  return d.getTime();
}

// Dipakai buat nge-bucket auto-stop per menit, biar tidak ada 2 baris
// dengan jam:menit yang sama persis di riwayat.
function startOfMinute(ts) {
  return Math.floor(ts / MINUTE_MS) * MINUTE_MS;
}

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTH_LABELS_ID[d.getMonth()]}`;
}

function formatDateLong(ts) {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTH_LABELS_LONG_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDayLabel(ts) {
  const d = new Date(ts);
  return `${DAY_LABELS_LONG_ID[d.getDay()]}, ${formatDate(ts)}`;
}

function formatMonthLabel(ts) {
  const d = new Date(ts);
  return `${MONTH_LABELS_LONG_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function formatDuration(sec) {
  const s = Math.max(0, Math.round(sec ?? 0));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
    s % 60,
  ).padStart(2, "0")}`;
}

// Dipanggil saat sesi latihan berhenti (useSession.stop)
export async function recordSession({
  startedAt,
  endedAt,
  durationSec,
  avgForce,
  peakForce,
}) {
  if (!durationSec || durationSec < 1) return; // sesi kelewat singkat, tidak sempat ada data
  return db.sessions.add({ startedAt, endedAt, durationSec, avgForce, peakForce });
}

// Dipanggil setiap event auto-stop masuk, kapan pun selama device terhubung.
//
// Alat (terutama hardware asli, bukan mock) bisa saja mengirim beberapa
// notifikasi "autostop" beruntun selagi motor masih LOCKED di sekitar
// threshold yang sama. Supaya riwayat tidak penuh baris duplikat di menit
// yang sama, kita anggap semua auto-stop dalam satu menit yang sama sebagai
// SATU kejadian: kalau sudah ada baris di menit itu, update force-nya ke
// bacaan terakhir, bukan menambah baris baru.
export async function recordAutoStop({ ts, force }) {
  const minuteStart = startOfMinute(ts);
  const minuteEnd = minuteStart + MINUTE_MS;

  const existing = await db.autoStops
    .where("ts")
    .between(minuteStart, minuteEnd, true, false)
    .first();

  if (existing) {
    return db.autoStops.update(existing.id, { force });
  }

  return db.autoStops.add({ ts, force });
}

// weekOffset: 0 = minggu ini, -1 = minggu lalu, -2 = dua minggu lalu, dst.
// Minggu depan (offset > 0) sengaja tidak diizinkan karena belum ada datanya.
export async function getWeeklyHistory(weekOffset = 0) {
  const now = Date.now();
  const currentWeekStart = startOfWeek(now);
  const weekStart = currentWeekStart + weekOffset * 7 * DAY_MS;
  const weekEnd = weekStart + 7 * DAY_MS;
  const prevWeekStart = weekStart - 7 * DAY_MS;

  const [thisWeekSessions, prevWeekSessions, weekAutoStopRows] = await Promise.all([
    db.sessions.where("startedAt").between(weekStart, weekEnd, true, false).toArray(),
    db.sessions
      .where("startedAt")
      .between(prevWeekStart, weekStart, true, false)
      .toArray(),
    db.autoStops.where("ts").between(weekStart, weekEnd, true, false).toArray(),
  ]);

  // Rata-rata tekanan per hari, untuk grafik minggu yang sedang dilihat
  const buckets = new Map();
  for (let i = 0; i < 7; i++) {
    const dayStart = weekStart + i * DAY_MS;
    buckets.set(dayStart, {
      day: DAY_LABELS_ID[new Date(dayStart).getDay()],
      total: 0,
      count: 0,
    });
  }
  for (const s of thisWeekSessions) {
    const bucket = buckets.get(startOfDay(s.startedAt));
    if (bucket) {
      bucket.total += s.avgForce;
      bucket.count += 1;
    }
  }
  const weeklyGrip = Array.from(buckets.values()).map((b) => ({
    day: b.day,
    value: b.count > 0 ? Math.round(b.total / b.count) : 0,
  }));

  const sessionsThisWeek = thisWeekSessions.length;

  const avgGrip =
    sessionsThisWeek > 0
      ? Math.round(
          thisWeekSessions.reduce((sum, s) => sum + s.avgForce, 0) /
            sessionsThisWeek,
        )
      : 0;

  const prevAvgGrip =
    prevWeekSessions.length > 0
      ? prevWeekSessions.reduce((sum, s) => sum + s.avgForce, 0) /
        prevWeekSessions.length
      : 0;

  const changePercent =
    prevAvgGrip > 0 ? Math.round(((avgGrip - prevAvgGrip) / prevAvgGrip) * 100) : 0;

  const autoStops = weekAutoStopRows
    .slice()
    .sort((a, b) => b.ts - a.ts)
    .map((row) => ({
      date: formatDate(row.ts),
      time: formatTime(row.ts),
      force: row.force,
    }));

  return {
    weekOffset,
    weekLabel: `${formatDate(weekStart)} – ${formatDate(weekEnd - DAY_MS)}`,
    isCurrentWeek: weekOffset === 0,
    canGoNext: weekOffset < 0, // minggu depan belum terjadi, jadi tidak bisa dilihat
    weeklyGrip,
    sessionsThisWeek,
    avgGrip,
    changePercent,
    autoStops,
    autoStopsThisWeek: weekAutoStopRows.length,
  };
}

// dayOffset: 0 = hari ini, -1 = kemarin, dst. Hari depan (offset > 0) tidak diizinkan.
export async function getDaySessions(dayOffset = 0) {
  const now = Date.now();
  const todayStart = startOfDay(now);
  const dayStart = todayStart + dayOffset * DAY_MS;
  const dayEnd = dayStart + DAY_MS;

  const rows = await db.sessions
    .where("startedAt")
    .between(dayStart, dayEnd, true, false)
    .sortBy("startedAt");

  const sessions = rows.map((s) => ({
    id: s.id,
    time: formatTime(s.startedAt),
    durationLabel: formatDuration(s.durationSec),
    avgForce: s.avgForce,
    peakForce: s.peakForce,
  }));

  return {
    dayOffset,
    dayLabel: formatDayLabel(dayStart),
    isToday: dayOffset === 0,
    canGoNext: dayOffset < 0, // hari depan belum terjadi, jadi tidak bisa dilihat
    sessions,
  };
}

// monthOffset: 0 = bulan ini, -1 = bulan lalu, dst. Dipakai khusus untuk laporan PDF.
export async function getMonthlyStats(monthOffset = 0) {
  const now = Date.now();
  const currentMonthStart = startOfMonth(now);
  const monthStart = addMonths(currentMonthStart, monthOffset);
  const monthEnd = addMonths(currentMonthStart, monthOffset + 1);
  const prevMonthStart = addMonths(currentMonthStart, monthOffset - 1);

  const [thisMonthSessions, prevMonthSessions, autoStopsThisMonth] = await Promise.all([
    db.sessions.where("startedAt").between(monthStart, monthEnd, true, false).toArray(),
    db.sessions
      .where("startedAt")
      .between(prevMonthStart, monthStart, true, false)
      .toArray(),
    db.autoStops.where("ts").between(monthStart, monthEnd, true, false).count(),
  ]);

  const sessionsThisMonth = thisMonthSessions.length;

  const avgGrip =
    sessionsThisMonth > 0
      ? Math.round(
          thisMonthSessions.reduce((sum, s) => sum + s.avgForce, 0) /
            sessionsThisMonth,
        )
      : 0;

  const prevAvgGrip =
    prevMonthSessions.length > 0
      ? prevMonthSessions.reduce((sum, s) => sum + s.avgForce, 0) /
        prevMonthSessions.length
      : 0;

  const changePercent =
    prevAvgGrip > 0 ? Math.round(((avgGrip - prevAvgGrip) / prevAvgGrip) * 100) : 0;

  return {
    monthLabel: formatMonthLabel(monthStart),
    sessionsThisMonth,
    avgGrip,
    changePercent,
    autoStopsThisMonth,
  };
}

// Data lengkap untuk laporan PDF: perbandingan mingguan + bulanan sekaligus.
export async function getReportData() {
  const [week, month] = await Promise.all([
    getWeeklyHistory(0),
    getMonthlyStats(0),
  ]);
  return {
    generatedAtLabel: formatDateLong(Date.now()),
    week,
    month,
  };
}

// Seluruh riwayat sesi (tidak dibatasi minggu/bulan), untuk ekspor CSV.
export async function getAllSessionsForExport() {
  const rows = await db.sessions.orderBy("startedAt").toArray();
  return rows.map((s) => ({
    tanggal: formatDate(s.startedAt),
    jam: formatTime(s.startedAt),
    durasi: formatDuration(s.durationSec),
    rataRataGram: s.avgForce,
    puncakGram: s.peakForce,
  }));
}