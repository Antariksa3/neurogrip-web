import { useCallback, useEffect, useRef, useState } from "react";

export function useSession() {
  const [state, setState] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const tick = useRef(null);

  useEffect(() => {
    if (state !== "running") return;
    tick.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(tick.current);
  }, [state]);

  const start = useCallback(() => {
    setSeconds(0);
    setState("running");
  }, []);

  const pause = useCallback(() => setState("paused"), []);
  const resume = useCallback(() => setState("running"), []);

  const stop = useCallback(() => {
    setState("idle");
    setSeconds(0);
  }, []);

  const elapsed = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;

  return { state, seconds, elapsed, start, pause, resume, stop };
}
