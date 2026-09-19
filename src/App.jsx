import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Connect from "@/pages/Connect";
import Dashboard from "@/pages/Dashboard";
import History from "@/pages/History";
import Calibration from "@/pages/Calibration";
import Settings from "@/pages/Settings";
import Welcome from "@/pages/Welcome";
import { NeuroGripProvider } from "@/hooks/NeuroGripProvider";

function DevNav() {
  const link = ({ isActive }) =>
    `min-h-11 flex items-center px-3 text-sm rounded-md ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
    }`;

  return (
    <nav className="flex gap-1 p-2 border-b border-border bg-card">
      <NavLink to="/" className={link} end>
        Welcome
      </NavLink>
      <NavLink to="/connect" className={link}>
        Hubungkan
      </NavLink>
      <NavLink to="/dashboard" className={link}>
        Dashboard
      </NavLink>
      <NavLink to="/history" className={link}>
        Riwayat
      </NavLink>
      <NavLink to="/calibration" className={link}>
        Kalibrasi
      </NavLink>
      <NavLink to="/settings" className={link}>
        Pengaturan
      </NavLink>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NeuroGripProvider>
        <div className="w-full max-w-[480px] md:max-w-none lg:max-w-5xl xl:max-w-6xl mx-auto min-h-dvh flex flex-col bg-background text-foreground">
          {/* {import.meta.env.DEV && <DevNav />} */}
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/calibration" element={<Calibration />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
          <BottomNav />
        </div>
      </NeuroGripProvider>
    </BrowserRouter>
  );
}