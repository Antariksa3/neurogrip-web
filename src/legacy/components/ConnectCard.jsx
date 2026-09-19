import { Button } from "@/components/ui/button";

function humanizeError(raw = "") {
  const msg = raw.toLowerCase();
  if (msg.includes("cancel")) return "Pemilihan perangkat dibatalkan";
  if (msg.includes("not found") || msg.includes("no devices"))
    return "Perangkat tidak ditemukan. Pastikan alat menyala";
  return "Dekatkan HP Anda ke perangkat lalu coba lagi";
}

export default function ConnectCard({
  status,
  error,
  deviceName,
  onConnect,
  onContinue,
}) {
  return (
    <div className="w-full max-w-[21rem] rounded-3xl bg-card px-5 py-7 shadow-xl [letter-spacing:0.04em]">
      {status === "connecting" && <Connecting deviceName={deviceName} />}
      {status === "error" && <Failed error={error} onRetry={onConnect} />}
      {status === "connected" && (
        <Success deviceName={deviceName} onContinue={onContinue} />
      )}
      {(status === "idle" || !status) && (
        <Idle deviceName={deviceName} onConnect={onConnect} />
      )}
    </div>
  );
}

function Idle({ deviceName, onConnect }) {
  return (
    <div className="text-center">
      <DeviceGlyph />
      <h2 className="mt-4 text-xl font-bold text-foreground">{deviceName}</h2>
      <p className="mt-1 text-base text-muted-foreground">
        Perangkat ditemukan · siap disambungkan
      </p>
      <Button
        onClick={onConnect}
        className="mt-6 h-14 w-full rounded-2xl text-lg font-bold"
      >
        Hubungkan sekarang
      </Button>
    </div>
  );
}

function Connecting({ deviceName }) {
  return (
    <div className="text-center" aria-live="polite">
      <div
        className="mx-auto size-12 rounded-full border-4 border-primary/15
                   border-t-primary motion-safe:animate-spin"
        role="status"
        aria-label="Mencari perangkat"
      />
      <h2 className="mt-4 text-xl font-bold text-foreground">
        Mencari {deviceName}…
      </h2>
      <p className="mt-1 text-base text-muted-foreground">
        Pastikan perangkat dalam keadaan menyala
      </p>
    </div>
  );
}

function Failed({ error, onRetry }) {
  return (
    <div className="text-center" aria-live="assertive">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/10">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="size-7 text-destructive"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </div>
      <h2 className="mt-4 text-xl font-bold text-primary">Gagal terhubung</h2>
      <p className="mt-1 text-base text-muted-foreground">
        {humanizeError(error)}
      </p>
      <Button
        onClick={onRetry}
        className="mt-6 h-14 w-full rounded-2xl text-lg font-bold"
      >
        Coba lagi
      </Button>
    </div>
  );
}

function Success({ deviceName, onContinue }) {
  return (
    <div className="text-center" aria-live="polite">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-success/10">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-7 text-success"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h2 className="mt-4 text-xl font-bold text-primary">
        Berhasil terhubung
      </h2>
      <p className="mt-1 text-base text-muted-foreground">
        Terhubung ke {deviceName}
      </p>
      <Button
        onClick={onContinue}
        className="mt-6 h-14 w-full rounded-2xl text-lg font-bold"
      >
        Lanjut ke dashboard
      </Button>
    </div>
  );
}

function DeviceGlyph() {
  return (
    <div className="mx-auto grid size-12 place-items-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="size-9 text-primary"
        aria-hidden="true"
      >
        <rect x="2" y="7" width="20" height="10" rx="3" />
        <path d="M6 12h4" />
      </svg>
    </div>
  );
}
