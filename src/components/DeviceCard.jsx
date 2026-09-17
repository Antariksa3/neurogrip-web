import { Pause, Play, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import ErrorCard from "@/components/ErrorCard";
import gloveUrl from "@/assets/glove.svg";

export default function DeviceCard({
  connected,
  reconnecting = false,
  deviceName,
  connecting,
  error,
  sessionState,
  elapsed,
  onConnect,
  onPause,
  onStart,
}) {
  if (!connected) {
    if (error) {
      return (
        <ErrorCard
          icon={<WifiOff className="size-7 text-destructive" />}
          title="Gagal terhubung"
          message={error}
          onRetry={onConnect}
        />
      );
    }

    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <img src={gloveUrl} alt="" className="mx-auto size-14" />
        <h2 className="mt-3 text-lg font-bold text-foreground">{deviceName}</h2>
        <p
          className="mt-1 text-[14px] text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {connecting
            ? "Sedang menyambungkan ke perangkat…"
            : "Hubungkan NeuroGrip untuk memulai rehabilitasi"}
        </p>

        {connecting && (
          <div
            className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            aria-hidden="true"
          >
            <div className="h-full w-1/3 animate-[connecting-slide_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
          </div>
        )}

        <Button
          onClick={onConnect}
          disabled={connecting}
          className="mt-4 h-12 w-full gap-2 rounded-xl font-bold"
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
          <p
            className="flex items-center gap-1.5 text-[14px] text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {reconnecting ? (
              <>
                <span className="size-2 shrink-0 animate-pulse rounded-full bg-warning" />
                <span className="text-warning">Menyambung kembali…</span>
              </>
            ) : (
              "Perangkat tersambung"
            )}
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
