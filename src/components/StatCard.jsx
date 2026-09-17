export default function StatCard({ label, value, unit }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[15px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
        {value}
        {unit && (
          <span className="ml-1 text-base font-semibold text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}
