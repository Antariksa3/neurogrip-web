import { useEffect, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { useNeuroGrip } from "@/hooks/NeuroGripProvider";
import { CONFIG_LIMITS } from "@/lib/bleContract";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBanner from "@/components/StatusBanner";

export default function Calibration() {
  const { config, saveConfig, status, deviceStatus, configSynced } =
    useNeuroGrip();
  const navigate = useNavigate();

  const [draft, setDraft] = useState(config);
  const [syncedConfig, setSyncedConfig] = useState(config);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [leaveTarget, setLeaveTarget] = useState(null);

  // Config dari perangkat bisa berubah kapan saja (retained / disimpan dari
  // tempat lain). Draft hanya ikut kalau belum diubah user, supaya
  // yang sedang diedit tidak tertimpa diam-diam.
  if (
    syncedConfig.threshold !== config.threshold ||
    syncedConfig.sensitivity !== config.sensitivity
  ) {
    const untouched =
      draft.threshold === syncedConfig.threshold &&
      draft.sensitivity === syncedConfig.sensitivity;
    setSyncedConfig(config);
    if (untouched) setDraft(config);
  }

  const changed =
    draft.threshold !== config.threshold ||
    draft.sensitivity !== config.sensitivity;

  const thresholdChanged = draft.threshold !== config.threshold;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      changed && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!changed) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [changed]);

  // "Simpan dulu" dari dialog keluar: setelah tersimpan (changed jadi false)
  // baru lanjut ke halaman yang tadi ditahan.
  useEffect(() => {
    if (leaveTarget && !changed) navigate(leaveTarget, { replace: true });
  }, [leaveTarget, changed, navigate]);

  const connected = status === "connected" || status === "reconnecting";
  const canSave = changed && status === "connected";
  const gloveOffline = status === "connected" && deviceStatus === "offline";

  async function handleConfirm() {
    setSaving(true);
    setSaveError(null);
    try {
      await saveConfig(draft);
      setConfirming(false);
    } catch (err) {
      setSaveError(err.message ?? "Gagal menyimpan konfigurasi ke perangkat.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelSave() {
    setConfirming(false);
    setSaveError(null);
    setLeaveTarget(null);
  }

  function handleSaveBeforeLeave() {
    setLeaveTarget(blocker.location);
    blocker.reset();
    setConfirming(true);
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
        {changed && (
          <StatusBanner
            tone="warning"
            role="status"
            className="lg:col-span-2"
            icon={<TriangleAlert className="size-5" />}
            title="Perubahan belum disimpan"
            action={
              <button
                type="button"
                disabled={!canSave}
                onClick={() => setConfirming(true)}
                className="min-h-11 shrink-0 rounded-xl bg-warning px-4 text-base font-bold text-white
                           disabled:opacity-40"
              >
                Simpan perubahan
              </button>
            }
          >
            Pengaturan baru belum dikirim ke sarung tangan.
          </StatusBanner>
        )}

        {!connected ? (
          <StatusBanner
            role="status"
            className="lg:col-span-2"
            title="Perangkat belum tersambung"
          >
            Perubahan tidak bisa dikirim sebelum perangkat tersambung dari
            halaman Beranda.
          </StatusBanner>
        ) : gloveOffline ? (
          <StatusBanner
            role="status"
            className="lg:col-span-2"
            title="Sarung tangan tidak aktif"
          >
            Perubahan belum tentu diterima sampai sarung tangan menyala
            kembali. Pastikan pengaturan ini tetap sesuai saat alat dipakai.
          </StatusBanner>
        ) : (
          !configSynced && (
            <StatusBanner
              role="status"
              className="lg:col-span-2"
              title="Belum membaca pengaturan dari sarung tangan"
            >
              Angka di bawah masih nilai bawaan aplikasi, bukan pengaturan yang
              sedang dipakai sarung tangan.
            </StatusBanner>
          )
        )}

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-bold text-foreground">
            Sensitivitas deteksi genggaman (EMG)
          </h2>
          <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
            Naikkan jika alat tampak lambat atau sulit merespons saat pasien
            mencoba menggenggam. Turunkan jika alat bergerak sendiri padahal
            pasien belum berusaha menggenggam.
          </p>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Kenapa ini penting: sensitivitas menentukan seberapa kuat sinyal
            otot pasien harus terbaca sebelum alat mulai membantu menggenggam.
          </p>

          <div className="mt-5 flex items-baseline justify-between">
            <span className="text-base text-foreground">Sensitivitas</span>
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
            disabled={!connected}
            className="mt-2 h-11 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
          />

          <div className="flex justify-between text-base text-muted-foreground">
            <span>Rendah</span>
            <span>Tinggi</span>
          </div>
        </section>

        <section className="rounded-2xl border border-warning bg-warning/5 p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <TriangleAlert className="size-4 shrink-0 text-warning" />
            Batas tekanan aman (auto-stop)
          </h2>
          <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
            Ini adalah parameter keselamatan. Alat akan berhenti menggenggam
            otomatis ketika tekanan pada tangan pasien melebihi batas ini,
            untuk mencegah cedera.
          </p>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Kenapa ini penting: batas yang terlalu longgar berisiko membiarkan
            tekanan berlebih sebelum alat berhenti; batas yang terlalu ketat
            bisa membuat alat berhenti padahal genggaman masih wajar. Sesuaikan
            dengan anjuran terapis pasien.
          </p>

          <div className="mt-5 flex items-baseline justify-between">
            <span className="text-base text-foreground">Batas tekanan</span>
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
            disabled={!connected}
            className="mt-2 h-11 w-full cursor-pointer accent-warning disabled:cursor-not-allowed disabled:opacity-50"
          />

          <div className="flex justify-between text-base text-muted-foreground">
            <span>{CONFIG_LIMITS.threshold.min} g (lebih ketat)</span>
            <span>{CONFIG_LIMITS.threshold.max} g (lebih longgar)</span>
          </div>
        </section>
      </div>

      <div className="mt-auto px-5 pb-8">
        <button
          type="button"
          disabled={!canSave}
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
        onCancel={handleCancelSave}
      >
        {saveError && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-base font-semibold text-destructive">
            {saveError}
          </p>
        )}
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
        {gloveOffline && (
          <p className="font-semibold text-warning">
            Sarung tangan sedang tidak aktif, jadi perubahan ini belum tentu
            dipakai sampai alat menyala kembali.
          </p>
        )}
        <p>
          Pastikan batas ini sudah sesuai anjuran terapis Anda sebelum
          melanjutkan.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={blocker.state === "blocked"}
        tone="warning"
        icon={<TriangleAlert className="size-5" />}
        title="Perubahan belum disimpan"
        confirmLabel="Lanjut mengedit"
        onConfirm={() => blocker.reset()}
        secondaryLabel="Simpan dulu"
        onSecondary={handleSaveBeforeLeave}
        cancelLabel="Buang perubahan"
        cancelTone="danger"
        onCancel={() => blocker.proceed()}
        onDismiss={() => blocker.reset()}
      >
        <p>
          Anda mengubah kalibrasi tapi belum menyimpannya. Kalau keluar sekarang
          tanpa menyimpan, perubahan ini akan hilang dan sarung tangan tetap
          memakai pengaturan lama.
        </p>
      </ConfirmDialog>
    </div>
  );
}
