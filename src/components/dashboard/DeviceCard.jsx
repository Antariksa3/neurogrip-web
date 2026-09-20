import { Pause, Play, SignalHigh, SignalLow, SignalMedium, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import ErrorCard from "@/components/feedback/ErrorCard";
import gloveUrl from "@/assets/glove.svg";

const QUALITY_META = {
  good: { icon: SignalHigh, label: "Koneksi baik", className: "text-success" },
  fair: { icon: SignalMedium, label: "Koneksi cukup", className: "text-warning" },
  poor: { icon: SignalLow, label: "Koneksi lemah", className: "text-destructive" },
};

export default function DeviceCard({
  connected,
  reconnecting = false,
  gloveOffline = false,
  deviceName,
  connecting,
  error,
  sessionState,
  elapsed,
  quality,
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
          helpTo="/faq?q=gagal-terhubung"
        />
      );
    }

    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <img src={gloveUrl} alt="" className="mx-auto size-14" />
        <h2 className="mt-3 text-lg font-bold text-foreground">{deviceName}</h2>
        <p
          className="mt-1 text-base text-muted-foreground"
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
            <div className="h-full w-1/3 animate-[connecting-slide_1.4s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full bg-primary" />
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
  const qualityMeta = quality ? QUALITY_META[quality] : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <img src={gloveUrl} alt="" className="size-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-bold text-foreground">
            {deviceName}
          </h2>
          <p
            className="flex items-center gap-1.5 text-base text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {reconnecting ? (
              <>
                <span className="size-2 shrink-0 animate-pulse rounded-full bg-warning" />
                <span className="text-warning">Menyambung kembali…</span>
              </>
            ) : (
              gloveOffline ? "Sarung tangan offline" : "Perangkat tersambung"
            )}
          </p>
        </div>
        {!reconnecting && qualityMeta && (
          <span
            className={`flex shrink-0 items-center gap-1 text-base font-semibold ${qualityMeta.className}`}
            role="status"
            aria-label={qualityMeta.label}
            title={qualityMeta.label}
          >
            <qualityMeta.icon className="size-5" />
          </span>
        )}
      </div>

      <div
        className="mt-4 text-center text-5xl font-extrabold tabular-nums text-foreground"
        aria-label="Durasi sesi"
      >
        {elapsed}
      </div>

      <button
        type="button"
        onClick={running ? onPause : onStart}
        className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-xl
                   bg-primary text-base font-bold text-white transition
                   hover:bg-primary/90 md:h-16 md:gap-3 md:rounded-2xl md:text-xl
                   md:shadow-md md:active:scale-[0.99]"
      >
        {running ? (
          <Pause className="size-5 md:size-6" />
        ) : (
          <Play className="size-5 md:size-6" />
        )}
        {running ? "Jeda latihan" : "Mulai latihan"}
      </button>
    </div>
  );
}
