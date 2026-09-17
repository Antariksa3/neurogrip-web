import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { useNeuroGrip } from "@/hooks/NeuroGripProvider";
import { CONFIG_LIMITS } from "@/lib/bleContract";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function Calibration() {
  const { config } = useNeuroGrip();

  return <CalibrationForm key={`${config.threshold}-${config.sensitivity}`} />;
}

function CalibrationForm() {
  const { config, saveConfig } = useNeuroGrip();
  const navigate = useNavigate();

  const [draft, setDraft] = useState(config);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const changed =
    draft.threshold !== config.threshold ||
    draft.sensitivity !== config.sensitivity;

  const thresholdChanged = draft.threshold !== config.threshold;

  async function handleConfirm() {
    setSaving(true);
    try {
      await saveConfig(draft);
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <header className="flex items-center gap-3 bg-card px-4 py-4 border-b border-border md:px-8 lg:px-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="grid size-11 shrink-0 place-items-center rounded-xl
                     text-foreground transition hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Kalibrasi sensor</h1>
      </header>

      <div className="space-y-4 px-5 py-5 md:px-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0 lg:px-10">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-[15px] font-bold text-foreground">
            Sensitivitas deteksi genggaman (EMG)
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
            Naikkan jika alat terasa lambat atau sulit mendeteksi niat
            menggenggam Anda. Turunkan jika alat bergerak tanpa Anda maksudkan.
          </p>

          <div className="mt-5 flex items-baseline justify-between">
            <span className="text-[15px] text-foreground">Sensitivitas</span>
            <span className="text-xl font-bold tabular-nums text-primary">
              {draft.sensitivity}%
            </span>
          </div>

          <input
            type="range"
            min={CONFIG_LIMITS.sensitivity.min}
            max={CONFIG_LIMITS.sensitivity.max}
            step={CONFIG_LIMITS.sensitivity.step}
            value={draft.sensitivity}
            onChange={(e) =>
              setDraft((d) => ({ ...d, sensitivity: Number(e.target.value) }))
            }
            aria-label="Sensitivitas deteksi genggaman"
            className="mt-2 h-11 w-full cursor-pointer accent-primary"
          />

          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>Rendah</span>
            <span>Tinggi</span>
          </div>
        </section>

        <section className="rounded-2xl border border-warning bg-warning/5 p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
            <TriangleAlert className="size-4 shrink-0 text-warning" />
            Batas tekanan aman (auto-stop)
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
            Ini adalah parameter keselamatan. Alat akan berhenti menggenggam
            otomatis ketika tekanan melebihi batas ini, untuk mencegah cedera
            pada tangan Anda.
          </p>

          <div className="mt-5 flex items-baseline justify-between">
            <span className="text-[15px] text-foreground">Batas tekanan</span>
            <span className="text-xl font-bold tabular-nums text-warning">
              {draft.threshold} g
            </span>
          </div>

          <input
            type="range"
            min={CONFIG_LIMITS.threshold.min}
            max={CONFIG_LIMITS.threshold.max}
            step={CONFIG_LIMITS.threshold.step}
            value={draft.threshold}
            onChange={(e) =>
              setDraft((d) => ({ ...d, threshold: Number(e.target.value) }))
            }
            aria-label="Batas tekanan aman"
            className="mt-2 h-11 w-full cursor-pointer accent-warning"
          />

          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>{CONFIG_LIMITS.threshold.min} g (lebih ketat)</span>
            <span>{CONFIG_LIMITS.threshold.max} g (lebih longgar)</span>
          </div>
        </section>
      </div>

      <div className="mt-auto px-5 pb-8">
        <button
          type="button"
          disabled={!changed}
          onClick={() => setConfirming(true)}
          className="h-14 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground
                     transition hover:bg-primary/90 disabled:opacity-40"
        >
          Simpan perubahan
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        tone="warning"
        icon={<TriangleAlert className="size-5" />}
        title="Konfirmasi batas keselamatan"
        confirmLabel="Ya, simpan perubahan"
        busy={saving}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      >
        {thresholdChanged ? (
          <p>
            Anda mengubah batas tekanan auto-stop dari{" "}
            <strong className="text-foreground">{config.threshold} gram</strong>{" "}
            menjadi{" "}
            <strong className="text-foreground">{draft.threshold} gram</strong>.
            Ini menentukan kapan alat akan berhenti menggenggam secara otomatis
            untuk mencegah cedera.
          </p>
        ) : (
          <p>
            Anda mengubah sensitivitas deteksi dari{" "}
            <strong className="text-foreground">{config.sensitivity}%</strong>{" "}
            menjadi{" "}
            <strong className="text-foreground">{draft.sensitivity}%</strong>.
          </p>
        )}
        <p>
          Pastikan batas ini sudah sesuai anjuran terapis Anda sebelum
          melanjutkan.
        </p>
      </ConfirmDialog>
    </div>
  );
}
