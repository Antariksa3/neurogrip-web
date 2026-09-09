import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { useNeuroGrip } from "@/hooks/NeuroGripProvider";
import { DEFAULT_CONFIG } from "@/lib/bleContract";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function Settings() {
  const { device, status, saveConfig, disconnect } = useNeuroGrip();
  const navigate = useNavigate();

  const [resetting, setResetting] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    setBusy(true);
    try {
      await saveConfig(DEFAULT_CONFIG);
      setResetting(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    await disconnect();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="grid size-11 shrink-0 place-items-center rounded-xl
                     text-foreground transition hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Pengaturan device</h1>
      </header>

      <div className="space-y-4 px-5 py-5">
        <section className="divide-y divide-border rounded-2xl border border-border bg-card">
          <InfoRow label="Nama device" value={device?.name ?? "—"} />
          <InfoRow label="Versi firmware" value={device?.firmware ?? "—"} />
          <InfoRow
            label="Status koneksi"
            value={
              <span className="inline-flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${
                    status === "connected"
                      ? "bg-success"
                      : "bg-muted-foreground"
                  }`}
                />
                {status === "connected" ? "Terhubung" : "Terputus"}
              </span>
            }
          />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-[15px] font-bold text-foreground">
            Reset ke kalibrasi pabrik
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
            Mengembalikan sensitivitas EMG dan batas tekanan aman ke pengaturan
            awal pabrik ({DEFAULT_CONFIG.threshold} gram).
          </p>
          <button
            type="button"
            onClick={() => setResetting(true)}
            className="mt-4 h-12 w-full rounded-xl border-2 border-destructive
                       font-bold text-destructive transition hover:bg-destructive/5"
          >
            Reset ke kalibrasi pabrik
          </button>
        </section>
      </div>

      <div className="mt-auto px-5 pb-8">
        <button
          type="button"
          onClick={handleDisconnect}
          className="min-h-11 w-full font-semibold text-destructive"
        >
          Putuskan koneksi
        </button>
      </div>

      <ConfirmDialog
        open={resetting}
        tone="danger"
        icon={<X className="size-5" />}
        title="Reset ke kalibrasi pabrik?"
        confirmLabel="Ya, reset sekarang"
        busy={busy}
        onConfirm={handleReset}
        onCancel={() => setResetting(false)}
      >
        <p>
          Sensitivitas EMG dan batas tekanan auto-stop akan dikembalikan ke
          pengaturan awal ({DEFAULT_CONFIG.threshold} gram). Tindakan ini tidak
          dapat dibatalkan.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <span className="text-[15px] text-muted-foreground">{label}</span>
      <span className="text-[15px] font-semibold text-foreground">{value}</span>
    </div>
  );
}
