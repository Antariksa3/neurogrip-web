import { NavLink, useLocation } from "react-router-dom";
import { ChartColumn, House, Settings, SlidersHorizontal } from "lucide-react";

const ITEMS = [
  { to: "/dashboard", label: "Beranda", icon: House },
  { to: "/history", label: "Riwayat", icon: ChartColumn },
  { to: "/calibration", label: "Kalibrasi", icon: SlidersHorizontal },
  { to: "/settings", label: "Pengaturan", icon: Settings },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  if (!ITEMS.some((i) => i.to === pathname)) return null;

  return (
    <nav
      aria-label="Navigasi utama"
      className="sticky bottom-0 z-30 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-base font-semibold transition ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <Icon className="size-6" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
