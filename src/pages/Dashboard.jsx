import { useEffect } from "react"; // <-- 1. PASTIKAN LINE INI SUDAH DI-IMPORT DI PALING ATAS
import { useNavigate } from "react-router-dom";
import { Activity, BatteryMedium, ChartColumn, Cog, Hand, Settings, SlidersHorizontal } from "lucide-react";
import { useNeuroGrip } from "@/hooks/NeuroGripProvider";
import { useSession } from "@/hooks/useSession";
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
  const { status, telemetry, config, device, connect } = useNeuroGrip();
  const session = useSession();
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (status === "idle") {
  //     connect().then(() => {
  //       session.start();
  //     });
  //   }
  // }, [status, connect, session]);

  const connected = status === "connected";
  const { emg, force, motor, batt } = telemetry;
  const threshold = config?.threshold ?? 400;
  const ratio = force / threshold;

  const forceTone = motor === MOTOR_STATE.LOCKED ? "danger" : ratio >= 0.6 ? "warning" : "default";
  const emgDetected = emg >= (config?.sensitivity ?? 55) / 2;
  const battTone = batt <= 20 ? "danger" : batt <= 40 ? "warning" : "default";

  async function handleConnect() {
    await connect();
    session.start(); 
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <header className="flex items-center justify-between gap-3 bg-primary px-5 py-5">
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

      <div className="space-y-3 px-5 py-4">
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-[14px] text-muted-foreground">
            {connected ? (
              <>
                Data langsung dari perangkat{" "}
                <span className="font-semibold text-foreground">· aktif</span>
              </>
            ) : (
              <span className="font-semibold text-foreground">
                Perangkat belum tersambung
              </span>
            )}
          </p>
        </div>

        <DeviceCard
          connected={connected}
          connecting={status === "connecting"}
          deviceName={device?.name ?? "NeuroGrip-Glove-01"}
          sessionState={session.state}
          elapsed={session.elapsed}
          onConnect={handleConnect}
          onPause={session.pause}
          onStart={session.start}
        />

        {connected && (
          <>
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
          </>
        )}
      </div>

      <div className="mt-auto flex gap-3 px-5 pb-8">
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
