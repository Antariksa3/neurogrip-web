import { db } from "./db";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function rand(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Data dummy sementara untuk mengisi History dengan berbagai skenario:
// - streak berjalan (beberapa hari berturut-turut sampai hari ini)
// - hari bolong di tengah streak (skenario "hasData: false" utk progress hari itu)
// - tren membaik (avgForce naik pelan) dan tren memburuk (minggu lalu lebih tinggi)
// - beberapa sesi dalam satu hari
// - auto-stop events tersebar, termasuk beberapa di menit yang sama (uji bucket per-menit)
// - bulan lalu terisi untuk laporan PDF/monthly stats
// - minggu kosong sama sekali (2 minggu lalu) untuk uji empty state
export async function seedDummyHistory() {
  await db.sessions.clear();
  await db.autoStops.clear();

  const now = Date.now();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const today = todayStart.getTime();

  const sessions = [];
  const autoStops = [];

  function addSession(
    dayOffset,
    hour,
    minute,
    durationSec,
    avgForce,
    peakForce,
  ) {
    const startedAt =
      today + dayOffset * DAY_MS + hour * HOUR_MS + minute * 60 * 1000;
    sessions.push({
      startedAt,
      endedAt: startedAt + durationSec * 1000,
      durationSec,
      avgForce,
      peakForce,
    });
    return startedAt;
  }

  function addAutoStop(ts, force) {
    autoStops.push({ ts, force });
  }

  // --- Minggu ini: streak 5 hari berjalan (hari ini s/d -4), tren naik ---
  // Hari ini: 2 sesi
  addSession(0, 8, 15, 185, 42, 58);
  const s0b = addSession(0, 17, 30, 240, 46, 61);
  addAutoStop(s0b + 200 * 1000, 61);

  // -1 (kemarin): 1 sesi, ada auto-stop
  const sm1 = addSession(-1, 9, 0, 210, 40, 59);
  addAutoStop(sm1 + 180 * 1000, 59);
  addAutoStop(sm1 + 181 * 1000, 60); // menit sama -> harus jadi 1 baris di riwayat

  // -2: 1 sesi pendek
  addSession(-2, 19, 45, 95, 35, 47);

  // -3: 2 sesi
  addSession(-3, 7, 50, 260, 38, 50);
  addSession(-3, 20, 10, 150, 41, 55);

  // -4: 1 sesi (ujung streak)
  addSession(-4, 8, 30, 200, 33, 44);

  // -5: BOLONG (tidak ada sesi) -> uji streak berhenti & hari kosong di DailyView
  // -6 (awal minggu ini kalau hari ini bukan Senin): 1 sesi ringan
  addSession(-6, 18, 0, 130, 30, 40);

  // --- Minggu lalu: lebih rendah dari minggu ini (uji changePercent negatif utk minggu lalu vs 2 minggu lalu, & positif utk minggu ini) ---
  for (let i = 7; i <= 12; i++) {
    if (i === 9) continue; // satu hari bolong juga
    addSession(
      -i,
      rand(7, 20),
      rand(0, 59),
      rand(90, 240),
      rand(25, 34),
      rand(35, 46),
    );
  }
  addAutoStop(today - 8 * DAY_MS + 12 * HOUR_MS, 52);
  addAutoStop(today - 11 * DAY_MS + 16 * HOUR_MS, 55);

  // --- 2 minggu lalu: KOSONG SAMA SEKALI (uji empty state WeeklyView) ---
  // sengaja tidak ditambahkan apa pun untuk rentang -14..-20

  // --- 3-4 minggu lalu / bulan lalu: terisi untuk laporan PDF & monthly stats ---
  for (let i = 21; i <= 45; i += rand(2, 4)) {
    const avg = rand(20, 50);
    addSession(
      -i,
      rand(7, 21),
      rand(0, 59),
      rand(90, 300),
      avg,
      avg + rand(8, 18),
    );
    if (Math.random() < 0.3) {
      addAutoStop(today - i * DAY_MS + rand(8, 20) * HOUR_MS, rand(48, 65));
    }
  }

  // --- Beberapa sesi sangat singkat (harus DIABAIKAN oleh recordSession, tapi
  // di sini kita insert langsung ke db jadi tetap masuk -- pakai durationSec >=1
  // supaya konsisten dengan aturan recordSession) ---
  addSession(-30, 6, 0, 45, pick([15, 60, 22]), pick([20, 70, 30]));

  await db.sessions.bulkAdd(sessions);
  await db.autoStops.bulkAdd(autoStops);

  return {
    sessions: sessions.length,
    autoStops: autoStops.length,
  };
}

export async function clearDummyHistory() {
  await db.sessions.clear();
  await db.autoStops.clear();
}

if (import.meta.env.DEV) {
  window.seedDummyHistory = seedDummyHistory;
  window.clearDummyHistory = clearDummyHistory;
}
