import { useCallback, useEffect, useRef, useState } from "react";
import * as mqtt from "@/lib/mqttAdapter";
import * as mock from "@/lib/mockAdapter";
import { isDemoMode } from "@/lib/demoMode";
import { DEFAULT_CONFIG, EMPTY_TELEMETRY } from "@/lib/bleContract";
import { recordAutoStop } from "@/lib/historyRepo";
import { notifyAutoStop } from "@/lib/feedback";
import { useSession } from "./useSession";

const DEVICE_ID_KEY = "neurogrip-device-id";
const TELEMETRY_STALE_MS = 10000;

const adapter = isDemoMode ? mock.mockAdapter : mqtt.mqttAdapter;
const isSupported = isDemoMode ? mock.isSupported : mqtt.isSupported;

export function useNeuroGripInternal() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [device, setDevice] = useState(null);
  const [telemetry, setTelemetry] = useState(EMPTY_TELEMETRY);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [autoStopAlert, setAutoStopAlert] = useState(null);
  const [quality, setQuality] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState("offline");
  const [configSynced, setConfigSynced] = useState(false);
  const [staleFlag, setStaleFlag] = useState(false);
  // Glove terdaftar "online" tapi datanya berhenti (mis. ESP32 hang, WiFi putus
  // sebelum LWT terkirim) — status online saja tidak cukup untuk percaya data live.
  const telemetryStale =
    staleFlag && status === "connected" && deviceStatus === "online";
  const session = useSession({
    hold:
      deviceStatus === "offline" ||
      status === "reconnecting" ||
      telemetryStale,
  });

  const alive = useRef(true);
  const lastTelemetryAt = useRef(0);
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  });

  useEffect(() => {
    alive.current = true;

    const offTelemetry = adapter.onTelemetry((data) => {
      if (!alive.current) return;
      lastTelemetryAt.current = Date.now();
      setStaleFlag(false);
      setTelemetry(data);
      if (sessionRef.current.state === "running") {
        sessionRef.current.recordSample(data.force);
      }
    });
    const offEvent = adapter.onEvent((evt) => {
      if (evt?.type === "autostop") {
        recordAutoStop({ ts: evt.ts, force: evt.force }).catch((err) => {
          console.error("Gagal menyimpan riwayat auto-stop:", err);
        });
        // Bunyi & banner ditangani di sini (bukan di Dashboard) supaya tidak
        // terulang tiap Dashboard dibuka ulang dan tetap berbunyi di halaman lain.
        notifyAutoStop();
        if (alive.current) setAutoStopAlert(evt);
      }
    });
    const offDisconnect = adapter.onDisconnect(() => {
      if (!alive.current) return;
      setStatus("idle");
      setTelemetry(EMPTY_TELEMETRY);
      setDevice(null);
      setQuality(null);
      setDeviceStatus("offline");
      setConfigSynced(false);
      if (sessionRef.current.state !== "idle") {
        sessionRef.current.stop();
      }
    });
    const offReconnect = adapter.onReconnect((reconnecting) => {
      if (!alive.current) return;
      setStatus(reconnecting ? "reconnecting" : "connected");
    });
    const offQuality = adapter.onQuality((q) => {
      if (alive.current) setQuality(q);
    });
    const offStatus = adapter.onStatus((s) => {
      if (!alive.current) return;
      if (s === "online") lastTelemetryAt.current = Date.now();
      setDeviceStatus(s);
    });
    const offConfig = adapter.onConfig((cfg) => {
      if (!alive.current) return;
      setConfig(cfg);
      setConfigSynced(true);
    });

    return () => {
      alive.current = false;
      offTelemetry();
      offEvent();
      offDisconnect();
      offReconnect();
      offQuality();
      offStatus();
      offConfig();
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setStaleFlag(Date.now() - lastTelemetryAt.current > TELEMETRY_STALE_MS);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const connect = useCallback(async () => {
    lastTelemetryAt.current = Date.now();
    setStatus("connecting");
    setError(null);
    setConfigSynced(false);
    if (adapter.awaitsConfig) setConfig(DEFAULT_CONFIG);
    try {
      const deviceId = localStorage.getItem(DEVICE_ID_KEY) || undefined;
      const info = await adapter.connect(deviceId);
      const cfg = await adapter.readConfig();
      if (!alive.current) return;
      setDevice(info);
      if (!adapter.awaitsConfig) {
        setConfig(cfg);
        setConfigSynced(true);
      }
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

  const dismissAutoStop = useCallback(() => setAutoStopAlert(null), []);

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
    autoStopAlert,
    dismissAutoStop,
    configSynced,
    quality,
    deviceStatus,
    telemetryStale,
    connect,
    disconnect,
    saveConfig,
    session,
    isSupported: isSupported(),
  };
}
