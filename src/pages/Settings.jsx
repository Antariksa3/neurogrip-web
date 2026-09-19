import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, CircleHelp, X } from "lucide-react";
import { useNeuroGrip } from "@/context/NeuroGripProvider";
import { useTextScale } from "@/hooks/useTextScale";
import { DEFAULT_CONFIG } from "@/lib/adapters/bleContract";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";

const PATIENT_NAME_KEY = "neurogrip-patient-name";
const DEVICE_ID_KEY = "neurogrip-device-id";

export default function Settings() {
  const { device, status, saveConfig, disconnect, connect } = useNeuroGrip();
  const { isLarge, toggle: toggleTextScale } = useTextScale();
  const navigate = useNavigate();

  const [resetting, setResetting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [patientName, setPatientName] = useState(
    () => localStorage.getItem(PATIENT_NAME_KEY) ?? "",
  );
  const [deviceId, setDeviceId] = useState(
    () => localStorage.getItem(DEVICE_ID_KEY) ?? "",
  );

  function handlePatientNameChange(e) {
    const value = e.target.value;
    setPatientName(value);
    localStorage.setItem(PATIENT_NAME_KEY, value);
  }

  const reconnectTimer = useRef(null);

  // Sambung ulang ditunda supaya mengetik ID tidak memutus-menyambung
  // koneksi di setiap huruf.
  function handleDeviceIdChange(e) {
    const value = e.target.value;
    setDeviceId(value);
    localStorage.setItem(DEVICE_ID_KEY, value.trim());

    clearTimeout(reconnectTimer.current);
    if (status === "connected" || status === "reconnecting") {
      reconnectTimer.current = setTimeout(async () => {
        await disconnect();
        connect();
      }, 800);
    }
  }

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
    localStorage.removeItem(DEVICE_ID_KEY);
    setDeviceId("");
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 md:px-8 lg:px-10">
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

      <div className="space-y-4 px-5 py-5 md:px-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0 lg:px-10">
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
                      : status === "reconnecting"
                        ? "animate-pulse bg-warning"
                        : "bg-muted-foreground"
                  }`}
                />
                {status === "connected"
                  ? "Terhubung"
                  : status === "reconnecting"
                    ? "Menyambung kembali…"
                    : "Terputus"}
              </span>
            }
          />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-bold text-foreground">
            Nama pasien
          </h2>
          <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
            Ditampilkan di laporan PDF supaya dokter atau terapis tahu ini
            laporan siapa saat dikirim atau dicetak.
          </p>
          <input
            type="text"
            value={patientName}
            onChange={handlePatientNameChange}
            placeholder="Nama pasien"
            className="mt-4 h-11 w-full rounded-xl border border-border bg-background px-4
                       text-[16px] text-foreground placeholder:text-muted-foreground
                       focus:border-primary focus:outline-none"
          />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-bold text-foreground">
            ID Perangkat
          </h2>
          <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
            Dipakai untuk membedakan beberapa NeuroGrip yang terhubung ke
            broker MQTT yang sama. Kosongkan jika hanya punya satu perangkat.
          </p>
          <input
            type="text"
            value={deviceId}
            onChange={handleDeviceIdChange}
            placeholder="Contoh: glove-01"
            className="mt-4 h-11 w-full rounded-xl border border-border bg-background px-4
                       text-[16px] text-foreground placeholder:text-muted-foreground
                       focus:border-primary focus:outline-none"
          />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Teks besar
              </h2>
              <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                Perbesar tampilan teks dan tombol di seluruh aplikasi. Berguna
                jika pendamping pasien kesulitan membaca angka atau menekan
                tombol saat mendampingi sesi.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isLarge}
              aria-label="Aktifkan teks besar"
              onClick={toggleTextScale}
              className={`relative h-11 w-[72px] shrink-0 rounded-full transition-colors ${
                isLarge ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 left-1 size-9 rounded-full bg-white shadow transition-transform ${
                  isLarge ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <button
            type="button"
            onClick={() => navigate("/faq")}
            className="flex min-h-11 w-full items-center justify-between gap-4 text-left"
          >
            <span className="flex items-center gap-3 text-base font-bold text-foreground">
              <CircleHelp className="size-5 text-primary" />
              Bantuan & FAQ
            </span>
            <ChevronRight className="size-5 text-muted-foreground" />
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-bold text-foreground">
            Reset ke kalibrasi pabrik
          </h2>
          <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
            Mengembalikan sensitivitas EMG dan batas tekanan aman ke pengaturan
            awal pabrik ({DEFAULT_CONFIG.threshold} gram). Gunakan ini jika
            hasil kalibrasi sebelumnya terasa tidak sesuai dan Anda ingin
            mulai ulang dari pengaturan standar.
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

      <div className="mt-auto px-5 pb-8 md:px-8 md:pb-10 lg:px-10">
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
      <span className="text-base text-muted-foreground">{label}</span>
      <span className="text-base font-semibold text-foreground">{value}</span>
    </div>
  );
}