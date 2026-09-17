import { useCallback, useEffect, useRef, useState } from "react";
import { recordSession } from "@/lib/historyRepo";

export function useSession() {
  const [state, setState] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const tick = useRef(null);
  const startedAtRef = useRef(null);                
  const statsRef = useRef({ sum: 0, count: 0, peak: 0 });

  useEffect(() => {
    if (state !== "running") return;
    tick.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(tick.current);
  }, [state]);

  const start = useCallback(() => {
    setSeconds(0);
    startedAtRef.current = Date.now();
    statsRef.current = { sum: 0, count: 0, peak: 0 };
    setState("running");
  }, []);

  const pause = useCallback(() => setState("paused"), []);
  const resume = useCallback(() => setState("running"), []);

  const recordSample = useCallback(
    (force) => {
      if (state !== "running" || typeof force !== "number") return;
      const s = statsRef.current;
      s.sum += force;
      s.count += 1;
      s.peak = Math.max(s.peak, force);
    },
    [state],
  );

  const stop = useCallback(() => {
    const { sum, count, peak } = statsRef.current;
    const startedAt = startedAtRef.current;
    if (startedAt && count > 0) {
      recordSession({
        startedAt,
        endedAt: Date.now(),
        durationSec: seconds,
        avgForce: Math.round(sum / count),
        peakForce: Math.round(peak),
      }).catch((err) => {
        console.error("Gagal menyimpan riwayat sesi:", err);
      });
    }
    setState("idle");
    setSeconds(0);
    startedAtRef.current = null;
  }, [seconds]);

  const elapsed = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;

  return { state, seconds, elapsed, start, pause, resume, stop, recordSample };
}