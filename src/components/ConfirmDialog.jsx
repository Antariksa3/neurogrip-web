import { useEffect, useRef } from "react";

export default function ConfirmDialog({
  open,
  tone = "warning",
  icon,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const accent = {
    warning: {
      bg: "bg-warning/15",
      fg: "text-warning",
      btn: "bg-warning hover:bg-warning/90",
    },
    danger: {
      bg: "bg-destructive/15",
      fg: "text-destructive",
      btn: "bg-destructive hover:bg-destructive/90",
    },
  }[tone];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-6"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-[21rem] rounded-3xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`grid size-11 place-items-center rounded-full ${accent.bg} ${accent.fg}`}
        >
          {icon}
        </div>

        <h2
          id="confirm-title"
          className="mt-4 text-lg font-bold text-foreground"
        >
          {title}
        </h2>

        <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
          {children}
        </div>

        <button
          ref={confirmRef}
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className={`mt-5 h-12 w-full rounded-xl font-bold text-white transition
                      disabled:opacity-60 ${accent.btn}`}
        >
          {busy ? "Menyimpan…" : confirmLabel}
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
