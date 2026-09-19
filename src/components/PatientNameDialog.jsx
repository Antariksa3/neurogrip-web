import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";

export default function PatientNameDialog({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return <NameForm onConfirm={onConfirm} onCancel={onCancel} />;
}

// Dipasang ulang tiap dialog dibuka, jadi input otomatis kosong tanpa reset lewat effect.
function NameForm({ onConfirm, onCancel }) {
  const [name, setName] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const trimmed = name.trim();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-6"
      onClick={onCancel}
    >
      <form
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="patient-name-title"
        className="w-full max-w-[21rem] rounded-3xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed) onConfirm(trimmed);
        }}
      >
        <div className="grid size-11 place-items-center rounded-full bg-primary/15 text-primary">
          <User className="size-5" />
        </div>

        <h2
          id="patient-name-title"
          className="mt-4 text-lg font-bold text-foreground"
        >
          Isi nama pasien dulu
        </h2>

        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          Nama pasien akan dicantumkan di laporan PDF. Nama ini juga tersimpan
          di Pengaturan.
        </p>

        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap pasien"
          className="mt-4 h-11 w-full rounded-xl border border-border bg-background px-4
                     text-[16px] text-foreground placeholder:text-muted-foreground
                     focus:border-primary focus:outline-none"
        />

        <button
          type="submit"
          disabled={!trimmed}
          className="mt-5 h-12 w-full rounded-xl bg-primary font-bold text-white transition
                     hover:bg-primary/90 disabled:opacity-60"
        >
          Simpan & unduh PDF
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="mt-2 h-12 w-full rounded-xl bg-muted font-semibold text-foreground"
        >
          Batal
        </button>
      </form>
    </div>
  );
}
