import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BatteryLow,
  BatteryMedium,
  ChartColumn,
  Cog,
  Hand,
  PowerOff,
  Settings,
  SlidersHorizontal,
  WifiOff,
} from "lucide-react";
import { useNeuroGrip } from "@/hooks/NeuroGripProvider";
import { MOTOR_STATE } from "@/lib/bleContract";
import { exitDemoMode, isDemoMode } from "@/lib/demoMode";
import AutoStopAlert from "@/components/AutoStopAlert";
import DeviceCard from "@/components/DeviceCard";
import DevicePairingDialog from "@/components/DevicePairingDialog";
import ProgressSummary from "@/components/ProgressSummary";
import SensorCard from "@/components/SensorCard";
import SessionPausedDialog from "@/components/SessionPausedDialog";
import StatusBanner from "@/components/StatusBanner";
import { Button } from "@/components/ui/button";

const DEVICE_ID_KEY = "neurogrip-device-id";

const MOTOR_LABEL = {
  [MOTOR_STATE.IDLE]: "Siap",
  [MOTOR_STATE.PULLING]: "Menarik",
  [MOTOR_STATE.LOCKED]: "Terkunci",
};

export default function Dashboard() {
  const {
    status,
    error,
    telemetry,
    config,
    device,
    connect,
    session,
    autoStopAlert,
    dismissAutoStop,
    quality,
    deviceStatus,
    telemetryStale,
  } = useNeuroGrip();
  const navigate = useNavigate();

  const reconnecting = status === "reconnecting";
  const connected = status === "connected" || reconnecting;
  const { emg, force, motor, batt } = telemetry;

  const [pairing, setPairing] = useState(false);

  function handleConnectClick() {
    if (isDemoMode || localStorage.getItem(DEVICE_ID_KEY)) {
      connect();
    } else {
      setPairing(true);
    }
  }

  function handlePairingConfirm(deviceId) {
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    setPairing(false);
    connect();
  }

  const stale =
    connected &&
    (reconnecting || deviceStatus === "offline" || telemetryStale);
  const threshold = config?.threshold ?? 400;
  const ratio = force / threshold;

  const forceTone =
    motor === MOTOR_STATE.LOCKED
      ? "danger"
      : ratio >= 0.6
        ? "warning"
        : "default";
  const emgDetected = emg >= (config?.sensitivity ?? 55) / 2;
  const battTone = batt <= 20 ? "danger" : batt <= 40 ? "warning" : "default";
  const battLow = connected && !stale && batt > 0 && batt <= 20;

  return (
    <div className="flex-1 flex flex-col bg-background">
      <header className="flex items-center justify-between gap-3 bg-primary px-5 py-5 md:px-8 lg:px-10">
        <h1 className="text-xl font-bold text-white">NeuroGrip Monitor</h1>
        <button
          type="button"
          onClick={() => navigate("/settings")}
          aria-label="Pengaturan"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15
                     text-white transition hover:bg-white/25"
        >
          <Settings className="size-5" />
        </button>
      </header>

      {isDemoMode && (
        <div className="mx-5 mt-4 flex items-center justify-between gap-3 rounded-2xl bg-warning/15 px-4 py-3 md:mx-8 lg:mx-10">
          <p className="text-base font-semibold text-foreground">
            Mode demo · data simulasi
          </p>
          <button
            type="button"
            onClick={exitDemoMode}
            className="min-h-11 shrink-0 rounded-xl px-3 text-base font-bold text-primary"
          >
            Keluar
          </button>
        </div>
      )}

      {autoStopAlert && (
        <AutoStopAlert
          className="mx-5 mt-4 md:mx-8 lg:mx-10"
          force={autoStopAlert.force}
          onDismiss={dismissAutoStop}
        />
      )}

      <div className="space-y-4 px-5 py-4 md:px-8 lg:px-10">
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-base text-muted-foreground">
            {connected ? (
              reconnecting ? (
                <span className="font-semibold text-warning">
                  Koneksi terputus, mencoba menyambung kembali…
                </span>
              ) : (
                <>
                  Data langsung dari perangkat{" "}
                  <span className="font-semibold text-foreground">
                    · aktif
                  </span>
                </>
              )
            ) : (
              <span className="font-semibold text-foreground">
                Perangkat belum tersambung
              </span>
            )}
          </p>
        </div>

        {connected && !reconnecting && deviceStatus === "offline" && (
          <StatusBanner
            icon={<PowerOff className="size-6" />}
            title="Sarung tangan tidak aktif"
          >
            Nyalakan sarung tangan dan pastikan baterainya terisi. Data akan
            muncul otomatis begitu perangkat menyala.
          </StatusBanner>
        )}

        {telemetryStale && (
          <StatusBanner
            icon={<WifiOff className="size-6" />}
            title="Data dari sarung tangan berhenti masuk"
          >
            Sarung tangan tampak menyala tetapi tidak mengirim data. Sesi
            dijeda otomatis. Coba matikan lalu nyalakan kembali sarung tangan.
          </StatusBanner>
        )}

        {battLow && (
          <StatusBanner
            tone="warning"
            icon={<BatteryLow className="size-6" />}
            title={`Baterai hampir habis (${batt}%)`}
          >
            Isi daya sarung tangan sebelum latihan berikutnya supaya tidak mati
            mendadak saat dipakai.
          </StatusBanner>
        )}

        <ProgressSummary />

        <DeviceCard
          connected={connected}
          reconnecting={reconnecting}
          connecting={status === "connecting"}
          error={status === "error" ? error : null}
          deviceName={device?.name ?? "NeuroGrip-Glove-01"}
          sessionState={session.state}
          elapsed={session.elapsed}
          quality={quality}
          onConnect={handleConnectClick}
          onPause={session.pause}
          onStart={session.start}
        />

        {connected && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <SensorCard
              icon={<Activity className="size-5" />}
              label="Sinyal EMG"
              value={stale ? "—" : emgDetected ? "Terdeteksi" : "Lemah"}
              tone={!stale && emgDetected ? "success" : "default"}
            />
            <SensorCard
              icon={<Cog className="size-5" />}
              label="Status motor"
              value={stale ? "—" : (MOTOR_LABEL[motor] ?? "Siap")}
              tone={!stale && motor === MOTOR_STATE.LOCKED ? "danger" : "default"}
            />
            <SensorCard
              icon={<Hand className="size-5" />}
              label="Tekanan genggam"
              value={stale ? "—" : `${force} gram`}
              tone={stale ? "default" : forceTone}
            />
            <SensorCard
              icon={<BatteryMedium className="size-5" />}
              label="Baterai"
              value={stale ? "—" : `${batt}%`}
              tone={stale ? "default" : battTone}
            />
          </div>
        )}
      </div>

      <div className="mt-auto hidden gap-3 px-5 pb-8 md:flex md:px-8 md:pb-10 lg:px-10">
        <Button
          onClick={() => navigate("/history")}
          className="h-13 flex-1 gap-2 rounded-xl font-bold"
        >
          <ChartColumn className="size-5" />
          Lihat riwayat latihan
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/calibration")}
          className="h-13 flex-1 gap-2 rounded-xl border-2 border-primary font-bold text-primary"
        >
          <SlidersHorizontal className="size-5" />
          Kalibrasi sensor
        </Button>
      </div>

      <SessionPausedDialog
        open={session.state === "paused"}
        onResume={session.resume}
        onEnd={session.stop}
      />

      <DevicePairingDialog
        open={pairing}
        onConfirm={handlePairingConfirm}
        onCancel={() => setPairing(false)}
      />
    </div>
  );
}