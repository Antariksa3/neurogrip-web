export default function HistorySkeleton({ compact = false }) {
  if (compact) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
