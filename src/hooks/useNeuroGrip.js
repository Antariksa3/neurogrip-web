import { useCallback, useEffect, useRef, useState } from "react";
import { bleAdapter, isSupported } from "@/lib/bleAdapter";
import { mockAdapter } from "@/lib/mockAdapter";
import { DEFAULT_CONFIG, EMPTY_TELEMETRY } from "@/lib/bleContract";
import { recordAutoStop } from "@/lib/historyRepo";

const useMock = import.meta.env.VITE_USE_MOCK === "true";
const adapter = useMock ? mockAdapter : bleAdapter;

export function useNeuroGripInternal() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [device, setDevice] = useState(null);
  const [telemetry, setTelemetry] = useState(EMPTY_TELEMETRY);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [lastEvent, setLastEvent] = useState(null);

  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;

    const offTelemetry = adapter.onTelemetry((data) => {
      if (alive.current) setTelemetry(data);
    });
    const offEvent = adapter.onEvent((evt) => {
      if (alive.current) setLastEvent(evt);

      if (evt?.type === "autostop") {
        recordAutoStop({ ts: evt.ts, force: evt.force }).catch((err) => {
          console.error("Gagal menyimpan riwayat auto-stop:", err);
        });
      }
    });
    const offDisconnect = adapter.onDisconnect(() => {
      if (!alive.current) return;
      setStatus("idle");
      setTelemetry(EMPTY_TELEMETRY);
      setDevice(null);
    });

    return () => {
      alive.current = false;
      offTelemetry();
      offEvent();
      offDisconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      const info = await adapter.connect();
      const cfg = await adapter.readConfig();
      if (!alive.current) return;
      setDevice(info);
      setConfig(cfg);
      setStatus("connected");
    } catch (err) {
      if (!alive.current) return;
      setError(err.message ?? "Gagal menyambungkan perangkat.");
      setStatus("error");
    }
  }, []);

  const disconnect = useCallback(async () => {
    await adapter.disconnect();
  }, []);

  const saveConfig = useCallback(async (next) => {
    const saved = await adapter.writeConfig(next);
    if (alive.current) setConfig(saved);
    return saved;
  }, []);

  return {
    status,
    error,
    device,
    telemetry,
    config,
    lastEvent,
    connect,
    disconnect,
    saveConfig,
    isMock: adapter.isMock,
    isSupported: adapter.isMock || isSupported(),
  };
}