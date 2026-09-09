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
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={`grid size-11 place-items-center rounded-xl ${iconTone}`}>
        {icon}
      </div>
      <p className="mt-4 text-[15px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${valueTone}`}>
        {value}
      </p>
    </div>
  );
}
