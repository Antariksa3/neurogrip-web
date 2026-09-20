import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoUrl from "@/assets/neurogrip-logo.svg";

const AUTO_ADVANCE_MS = 3200;

function nextRoute() {
  try {
    const rec = new URLSearchParams(window.location.search).get("rec") === "1";
    if (!rec && localStorage.getItem("neurogrip-onboarded") !== "1") {
      return "/onboarding";
    }
  } catch {
    // localStorage tidak tersedia: lewati onboarding
  }
  return "/dashboard";
}

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(
      () => navigate(nextRoute(), { replace: true }),
      AUTO_ADVANCE_MS,
    );
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <button
      type="button"
      onClick={() => navigate(nextRoute(), { replace: true })}
      aria-label="Lanjut ke dashboard"
      className="flex-1 flex flex-col items-center justify-center gap-7 px-8 md:gap-9 md:px-12 lg:gap-11
                 bg-gradient-to-b from-[#0F6E56] to-[#0A4A3A] text-center"
    >
      <p className="text-[19px] font-bold text-white md:text-xl lg:text-2xl">
        Rehabilitasi Bersama
      </p>

      <img src={logoUrl} alt="NeuroGrip" className="w-56 md:w-64 lg:w-72" />

      <p className="text-[19px] font-bold text-white md:text-xl lg:text-2xl">
        NeuroGrip: Empowering Your Grip, Restoring Your Life.
      </p>
    </button>
  );
}