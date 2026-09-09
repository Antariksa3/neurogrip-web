import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BatteryMedium,
  ChartColumn,
  Cog,
  Hand,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { useNeuroGrip } from "@/hooks/NeuroGripProvider";
import { MOTOR_STATE } from "@/lib/bleContract";
import SensorCard from "@/components/SensorCard";
import { Button } from "@/components/ui/button";

const MOTOR_LABEL = {
  [MOTOR_STATE.IDLE]: "Siap",
  [MOTOR_STATE.PULLING]: "Menarik",
  [MOTOR_STATE.LOCKED]: "Terkunci",
};

export default function Dashboard() {
  const { status, telemetry, config, device } = useNeuroGrip();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "idle") navigate("/", { replace: true });
  }, [status, navigate]);

  const { emg, force, motor, batt } = telemetry;
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
      <header className="bg-primary px-6 pt-8 pb-16">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-bold leading-tight text-white">
              NeuroGrip Monitor
            </h1>
            <p className="mt-1 flex items-center gap-2 text-[15px] text-white/80">
              <span
                className={`size-2 rounded-full ${
                  status === "connected" ? "bg-success" : "bg-white/40"
                }`}
              />
              {device?.name ?? "NeuroGrip-Glove-01"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/settings")}
            aria-label="Pengaturan"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15
                       text-white transition hover:bg-white/25"
          >
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      <div className="px-6 pb-8">
        <div className="-mt-10 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <p className="text-[15px] text-muted-foreground">
            {status === "connected" ? (
              <>
                Data langsung dari perangkat{" "}
                <span className="font-semibold text-foreground">· aktif</span>
              </>
            ) : (
              <span className="font-semibold text-foreground">
                Perangkat terputus
              </span>
            )}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
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
      </div>

      <div className="mt-auto space-y-3 px-6 pb-8">
        <Button
          onClick={() => navigate("/history")}
          className="h-14 w-full justify-start gap-3 rounded-2xl px-5 text-lg font-bold"
        >
          <ChartColumn className="size-5" />
          Lihat sensor
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/calibration")}
          className="h-14 w-full justify-start gap-3 rounded-2xl border-2 border-primary
                     px-5 text-lg font-bold text-primary"
        >
          <SlidersHorizontal className="size-5" />
          Kalibrasi sensor
        </Button>
      </div>
    </div>
  );
}
