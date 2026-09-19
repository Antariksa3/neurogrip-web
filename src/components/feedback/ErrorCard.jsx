import { RefreshCw } from "lucide-react";
import HelpLink from "@/components/feedback/HelpLink";

export default function ErrorCard({
  icon,
  title = "Terjadi kesalahan",
  message,
  retryLabel = "Coba lagi",
  onRetry,
  helpTo,
  className = "",
}) {
  return (
    <div
      role="alert"
      className={`rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-center ${className}`}
    >
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10">
        {icon}
      </div>
      <h2 className="mt-3 text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-base leading-relaxed text-muted-foreground">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary
                   text-base font-bold text-primary-foreground transition hover:bg-primary/90"
      >
        <RefreshCw className="size-4" />
        {retryLabel}
      </button>
      {helpTo && <HelpLink to={helpTo} className="mt-2" />}
    </div>
  );
}
