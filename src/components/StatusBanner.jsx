export default function StatusBanner({
  tone = "destructive",
  icon,
  title,
  children,
  action,
  role = "alert",
  className = "",
}) {
  const box = {
    destructive: "border-destructive bg-destructive/10",
    warning: "border-warning bg-warning/10",
  }[tone];

  const titleTone = {
    destructive: "text-destructive",
    warning: "text-foreground",
  }[tone];

  const iconTone = {
    destructive: "text-destructive",
    warning: "text-warning",
  }[tone];

  return (
    <div
      role={role}
      className={`flex flex-col gap-3 rounded-2xl border-2 p-4 md:flex-row md:items-center md:justify-between ${box} ${className}`}
    >
      <div>
        <p className={`flex items-center gap-2 text-lg font-bold ${titleTone}`}>
          {icon && <span className={`shrink-0 ${iconTone}`}>{icon}</span>}
          {title}
        </p>
        <p className="mt-1 text-base text-foreground">{children}</p>
      </div>
      {action}
    </div>
  );
}
