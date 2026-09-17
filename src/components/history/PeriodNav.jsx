import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PeriodNav({
  label,
  onPrev,
  onNext,
  canNext,
  prevLabel,
  nextLabel,
  className = "",
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border border-border bg-card px-2 py-2 ${className}`}
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label={prevLabel}
        className="grid size-10 shrink-0 place-items-center rounded-xl text-foreground
                   transition hover:bg-muted"
      >
        <ChevronLeft className="size-5" />
      </button>
      <span className="text-[15px] font-semibold text-foreground">{label}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label={nextLabel}
        className="grid size-10 shrink-0 place-items-center rounded-xl text-foreground
                   transition hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
