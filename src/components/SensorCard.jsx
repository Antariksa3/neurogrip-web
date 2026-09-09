export default function SensorCard({ icon, label, value, tone = "default" }) {
  const valueTone = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  }[tone];

  const iconTone = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <div
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${iconTone}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[14px] text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold tabular-nums ${valueTone}`}>{value}</p>
      </div>
    </div>
  );
}
