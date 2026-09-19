import {
  createBrowserRouter,
  NavLink,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Connect from "@/pages/Connect";
import Dashboard from "@/pages/Dashboard";
import History from "@/pages/History";
import Calibration from "@/pages/Calibration";
import Faq from "@/pages/Faq";
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

function Layout() {
  return (
    <NeuroGripProvider>
      <div className="w-full max-w-[480px] md:max-w-none lg:max-w-5xl xl:max-w-6xl mx-auto min-h-dvh flex flex-col bg-background text-foreground">
        {/* {import.meta.env.DEV && <DevNav />} */}
        <Outlet />
        <BottomNav />
      </div>
    </NeuroGripProvider>
  );
}

// Data router (bukan <BrowserRouter>) karena useBlocker — dipakai Calibration
// untuk menahan navigasi saat ada perubahan belum tersimpan — hanya jalan di sini.
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Welcome /> },
      { path: "/connect", element: <Connect /> },
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/history", element: <History /> },
      { path: "/calibration", element: <Calibration /> },
      { path: "/settings", element: <Settings /> },
      { path: "/faq", element: <Faq /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
