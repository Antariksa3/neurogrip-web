import { useCallback, useEffect, useRef, useState } from "react";
import { mqttAdapter as adapter, isSupported } from "@/lib/mqttAdapter";
import { DEFAULT_CONFIG, EMPTY_TELEMETRY } from "@/lib/bleContract";
import { recordAutoStop } from "@/lib/historyRepo";
import { useSession } from "./useSession";

export function useNeuroGripInternal() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [device, setDevice] = useState(null);
  const [telemetry, setTelemetry] = useState(EMPTY_TELEMETRY);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [lastEvent, setLastEvent] = useState(null);
  const session = useSession();

  const alive = useRef(true);
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  });

  useEffect(() => {
    alive.current = true;

    const offTelemetry = adapter.onTelemetry((data) => {
      if (!alive.current) return;
      setTelemetry(data);
      if (sessionRef.current.state === "running") {
        sessionRef.current.recordSample(data.force);
      }
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
      if (sessionRef.current.state !== "idle") {
        sessionRef.current.stop();
      }
    });
    const offReconnect = adapter.onReconnect((reconnecting) => {
      if (!alive.current) return;
      setStatus(reconnecting ? "reconnecting" : "connected");
    });

    return () => {
      alive.current = false;
      offTelemetry();
      offEvent();
      offDisconnect();
      offReconnect();
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
      if (sessionRef.current.state === "idle") {
        sessionRef.current.start();
      }
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
    session,
    isSupported: isSupported(),
  };
}
