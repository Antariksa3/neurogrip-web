import { useEffect, useRef } from "react";

export default function SessionPausedDialog({ open, onResume, onEnd }) {
  const ref = useRef(null);

  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="paused-title"
        className="w-full max-w-[21rem] rounded-3xl bg-card p-6"
      >
        <h2 id="paused-title" className="text-xl font-bold text-foreground">
          Sesi Dijeda
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Alat sedang dijeda. Anda dapat melanjutkan sesi terapi atau
          mengakhirinya sekarang
        </p>

        <button
          ref={ref}
          type="button"
          onClick={onResume}
          className="mt-5 h-13 w-full rounded-xl bg-primary font-bold text-primary-foreground
                     transition hover:bg-primary/90"
        >
          Lanjutkan Sesi
        </button>

        <button
          type="button"
          onClick={onEnd}
          className="mt-3 h-13 w-full rounded-xl border-2 border-primary bg-transparent
                     font-bold text-primary transition hover:bg-primary/5"
        >
          Akhiri Sesi
        </button>
      </div>
    </div>
  );
}
