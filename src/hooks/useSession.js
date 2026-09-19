import { useCallback, useEffect, useRef, useState } from "react";
import { recordSession } from "@/lib/historyRepo";

const CHECKPOINT_MS = 30000;

// `hold` menghentikan timer & pencatatan sampel tanpa mengubah `state`
// (dipakai saat sarung tangan offline / koneksi sedang putus).
export function useSession({ hold = false } = {}) {
  const [state, setState] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const startedAtRef = useRef(null);
  const statsRef = useRef({ sum: 0, count: 0, peak: 0 });
  const secondsRef = useRef(0);
  const saveRef = useRef({ id: null, queue: Promise.resolve() });

  useEffect(() => {
    secondsRef.current = seconds;
  });

  const running = state === "running" && !hold;

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, [running]);

  // Antrean per sesi: checkpoint & stop() berurutan, jadi sesi yang baru
  // dibuat checkpoint pertamanya tidak sempat terduplikasi oleh stop().
  const persist = useCallback(() => {
    const { sum, count, peak } = statsRef.current;
    const startedAt = startedAtRef.current;
    if (!startedAt || count === 0) return;

    const snapshot = {
      startedAt,
      endedAt: Date.now(),
      durationSec: secondsRef.current,
      avgForce: Math.round(sum / count),
      peakForce: Math.round(peak),
    };
    const save = saveRef.current;
    save.queue = save.queue
      .then(async () => {
        const key = await recordSession({ id: save.id ?? undefined, ...snapshot });
        if (key) save.id = key;
      })
      .catch((err) => {
        console.error("Gagal menyimpan riwayat sesi:", err);
      });
  }, []);

  // Tab bisa tertutup / browser crash kapan saja; tanpa checkpoint seluruh
  // sesi yang belum di-stop() hilang.
  useEffect(() => {
    if (state !== "running") return;
    const interval = setInterval(persist, CHECKPOINT_MS);
    const onHide = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [state, persist]);

  const start = useCallback(() => {
    setSeconds(0);
    startedAtRef.current = Date.now();
    statsRef.current = { sum: 0, count: 0, peak: 0 };
    saveRef.current = { id: null, queue: Promise.resolve() };
    setState("running");
  }, []);

  const pause = useCallback(() => setState("paused"), []);
  const resume = useCallback(() => setState("running"), []);

  const recordSample = useCallback(
    (force) => {
      if (!running || typeof force !== "number") return;
      const s = statsRef.current;
      s.sum += force;
      s.count += 1;
      s.peak = Math.max(s.peak, force);
    },
    [running],
  );

  const stop = useCallback(() => {
    persist();
    setState("idle");
    setSeconds(0);
    startedAtRef.current = null;
  }, [persist]);

  const elapsed = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;

  return { state, seconds, elapsed, start, pause, resume, stop, recordSample };
}
