import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import gloveUrl from "@/assets/glove.svg";

export default function DeviceCard({
  connected,
  deviceName,
  connecting,
  sessionState,
  elapsed,
  onConnect,
  onPause,
  onStart,
}) {
  if (!connected) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <img src={gloveUrl} alt="" className="mx-auto size-14" />
        <h2 className="mt-3 text-lg font-bold text-foreground">{deviceName}</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Hubungkan NeuroGrip untuk memulai rehabilitasi
        </p>
        <Button
          onClick={onConnect}
          disabled={connecting}
          className="mt-4 h-12 w-full rounded-xl font-bold"
        >
          {connecting ? "Menghubungkan…" : "Hubungkan sekarang"}
        </Button>
      </div>
    );
  }

  const running = sessionState === "running";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <img src={gloveUrl} alt="" className="size-11 shrink-0" />
        <div>
          <h2 className="text-[17px] font-bold text-foreground">
            {deviceName}
          </h2>
          <p className="text-[14px] text-muted-foreground">
            Perangkat tersambung
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div
          className="flex h-14 flex-1 items-center justify-center rounded-xl
                     border-2 border-primary/30 text-2xl font-bold tabular-nums text-foreground"
          aria-label="Durasi sesi"
        >
          {elapsed}
        </div>

        <button
          type="button"
          onClick={running ? onPause : onStart}
          aria-label={running ? "Jeda sesi" : "Mulai sesi"}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-primary
                     text-white transition hover:bg-primary/90"
        >
          {running ? <Pause className="size-6" /> : <Play className="size-6" />}
        </button>
      </div>
    </div>
  );
}
