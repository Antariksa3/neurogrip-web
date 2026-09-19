import { db } from "@/lib/history/db";

const DAY_MS = 24 * 60 * 60 * 1000;

// Hari ke belakang yang dikosongkan supaya grafik terlihat natural. Hari ini
// dan 3 hari sebelumnya sengaja terisi agar streak > 1 tampil.
const SKIPPED_DAYS_AGO = new Set([5, 9, 12]);
const SPAN_DAYS = 21;

export async function seedDemoHistory() {
  const existing = await db.sessions.filter((s) => s.demo).count();
  if (existing > 0) return;

  const now = Date.now();
  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  const sessions = [];

  for (let ago = 0; ago < SPAN_DAYS; ago++) {
    if (SKIPPED_DAYS_AGO.has(ago)) continue;
    const dayStart = todayStart - ago * DAY_MS;
    const trend = (SPAN_DAYS - ago) * 5;
    const perDay = ago % 3 === 0 ? 2 : 1;

    for (let i = 0; i < perDay; i++) {
      const hour = i === 0 ? 8 : 17;
      let startedAt = dayStart + hour * 3600 * 1000 + ago * 60 * 1000;
      if (startedAt > now - 20 * 60 * 1000) startedAt = now - 30 * 60 * 1000;
      if (startedAt < dayStart) continue;

      const wobble = ((ago * 37 + i * 53) % 30) - 15;
      const avgForce = 150 + trend + wobble;
      const durationSec = 600 + ((ago * 71 + i * 29) % 420);
      sessions.push({
        startedAt,
        endedAt: startedAt + durationSec * 1000,
        durationSec,
        avgForce,
        peakForce: Math.round(avgForce * 1.55),
        demo: true,
      });
    }
  }

  const autoStops = [
    { daysAgo: 1, hour: 8, force: 412 },
    { daysAgo: 3, hour: 17, force: 405 },
    { daysAgo: 8, hour: 8, force: 398 },
  ].flatMap(({ daysAgo, hour, force }) => {
    const ts = todayStart - daysAgo * DAY_MS + (hour * 60 + 6) * 60 * 1000;
    return ts < now ? [{ ts, force, demo: true }] : [];
  });

  await db.sessions.bulkAdd(sessions);
  await db.autoStops.bulkAdd(autoStops);
}

export async function clearDemoHistory() {
  await db.sessions.filter((s) => s.demo).delete();
  await db.autoStops.filter((s) => s.demo).delete();
}
