import { useEffect, useRef, useState } from "react";
import { Wifi } from "lucide-react";

export default function DevicePairingDialog({ open, onConfirm, onCancel }) {
  const [deviceId, setDeviceId] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setDeviceId("");
    inputRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const trimmed = deviceId.trim();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-6"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pairing-title"
        className="w-full max-w-[21rem] rounded-3xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid size-11 place-items-center rounded-full bg-primary/15 text-primary">
          <Wifi className="size-5" />
        </div>

        <h2 id="pairing-title" className="mt-4 text-lg font-bold text-foreground">
          Hubungkan perangkat baru
        </h2>

        <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
          <p>
            Masukkan ID Perangkat yang tertera pada NeuroGrip Anda untuk
            menyambungkannya pertama kali.
          </p>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="Contoh: glove-01"
          className="mt-4 h-11 w-full rounded-xl border border-border bg-background px-4
                     text-[16px] text-foreground placeholder:text-muted-foreground
                     focus:border-primary focus:outline-none"
        />

        <button
          type="button"
          disabled={!trimmed}
          onClick={() => onConfirm(trimmed)}
          className="mt-5 h-12 w-full rounded-xl bg-primary font-bold text-white transition
                     hover:bg-primary/90 disabled:opacity-60"
        >
          Hubungkan
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="mt-2 h-12 w-full rounded-xl bg-muted font-semibold text-foreground"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
