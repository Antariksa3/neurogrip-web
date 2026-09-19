import { TriangleAlert, X } from "lucide-react";

export default function AutoStopAlert({ force, onDismiss, className = "" }) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-2xl border border-destructive bg-destructive/10 p-4 ${className}`}
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
      <div className="flex-1">
        <p className="text-base font-semibold text-foreground">
          Alat berhenti otomatis
        </p>
        <p className="mt-0.5 text-base leading-relaxed text-muted-foreground">
          Tekanan mencapai {force} gram, melebihi batas aman. Genggaman
          dihentikan untuk melindungi tangan Anda.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground
                   transition hover:bg-destructive/10"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
