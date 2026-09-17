import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BatteryMedium,
  ChartColumn,
  Cog,
  Hand,
  Settings,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from "lucide-react";
import { useNeuroGrip } from "@/hooks/NeuroGripProvider";
import { MOTOR_STATE } from "@/lib/bleContract";
import DeviceCard from "@/components/DeviceCard";
import SensorCard from "@/components/SensorCard";
import SessionPausedDialog from "@/components/SessionPausedDialog";
import { Button } from "@/components/ui/button";

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
    lastEvent,
  } = useNeuroGrip();
  const navigate = useNavigate();

  const reconnecting = status === "reconnecting";
  const connected = status === "connected" || reconnecting;
  const { emg, force, motor, batt } = telemetry;

  const [dismissedAutoStopTs, setDismissedAutoStopTs] = useState(null);
  const showAutoStopAlert =
    lastEvent?.type === "autostop" && lastEvent.ts !== dismissedAutoStopTs;

  useEffect(() => {
    if (lastEvent?.type === "autostop" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [lastEvent]);
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

      {showAutoStopAlert && (
        <div
          role="alert"
          className="mx-5 mt-4 flex items-start gap-3 rounded-2xl border border-destructive
                     bg-destructive/10 p-4 md:mx-8 lg:mx-10"
        >
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-foreground">
              Alat berhenti otomatis
            </p>
            <p className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">
              Tekanan mencapai {lastEvent.force} gram, melebihi batas aman.
              Genggaman dihentikan untuk melindungi tangan Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissedAutoStopTs(lastEvent.ts)}
            aria-label="Tutup notifikasi"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground
                       transition hover:bg-destructive/10"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="space-y-4 px-5 py-4 md:px-8 lg:px-10">
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-[14px] text-muted-foreground">
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

        <DeviceCard
          connected={connected}
          reconnecting={reconnecting}
          connecting={status === "connecting"}
          error={status === "error" ? error : null}
          deviceName={device?.name ?? "NeuroGrip-Glove-01"}
          sessionState={session.state}
          elapsed={session.elapsed}
          onConnect={connect}
          onPause={session.pause}
          onStart={session.start}
        />

        {connected && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <SensorCard
              icon={<Activity className="size-5" />}
              label="Sinyal EMG"
              value={emgDetected ? "Terdeteksi" : "Lemah"}
              tone={emgDetected ? "success" : "default"}
            />
            <SensorCard
              icon={<Cog className="size-5" />}
              label="Status motor"
              value={MOTOR_LABEL[motor] ?? "Siap"}
              tone={motor === MOTOR_STATE.LOCKED ? "danger" : "default"}
            />
            <SensorCard
              icon={<Hand className="size-5" />}
              label="Tekanan genggam"
              value={`${force} gram`}
              tone={forceTone}
            />
            <SensorCard
              icon={<BatteryMedium className="size-5" />}
              label="Baterai"
              value={`${batt}%`}
              tone={battTone}
            />
          </div>
        )}
      </div>

      <div className="mt-auto flex gap-3 px-5 pb-8 md:px-8 md:pb-10 lg:px-10">
        <Button
          onClick={() => navigate("/history")}
          className="h-13 flex-1 gap-2 rounded-xl font-bold"
        >
          <ChartColumn className="size-5" />
          Lihat sensor
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
    </div>
  );
}