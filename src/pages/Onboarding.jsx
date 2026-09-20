import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ShieldCheck, Wifi } from "lucide-react";

const ONBOARDED_KEY = "neurogrip-onboarded";

const SLIDES = [
  {
    icon: Activity,
    title: "Pantau latihan genggaman",
    body: "Lihat tekanan, durasi, dan perkembangan latihan dari HP.",
  },
  {
    icon: Wifi,
    title: "Hubungkan sarung tangan",
    body: "Nyalakan alat lalu masukkan ID Perangkat yang tertera pada alat.",
  },
  {
    icon: ShieldCheck,
    title: "Aman dipakai",
    body: "Alat berhenti otomatis saat tekanan mencapai batas aman dan aplikasi memberi peringatan.",
  },
];

function markOnboarded() {
  try {
    localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {
    // tanpa localStorage onboarding akan muncul lagi, tidak fatal
  }
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const Icon = slide.icon;
  const last = index === SLIDES.length - 1;

  function finish() {
    markOnboarded();
    navigate("/dashboard", { replace: true });
  }

  function tryDemo() {
    markOnboarded();
    window.location.href = "/dashboard?demo=1";
  }

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-[#0F6E56] to-[#0A4A3A] px-6 py-6 text-white md:px-12">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={finish}
          className="min-h-11 rounded-xl px-4 text-base font-semibold text-white/90 hover:bg-white/10"
        >
          Lewati
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div className="grid size-28 place-items-center rounded-full bg-white/15">
          <Icon className="size-14" />
        </div>
        <h1 className="text-2xl font-bold">{slide.title}</h1>
        <p className="max-w-sm text-lg leading-relaxed text-white/90">
          {slide.body}
        </p>
      </div>

      <div className="flex justify-center gap-2 py-4" aria-hidden="true">
        {SLIDES.map((s, i) => (
          <span
            key={s.title}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-2.5 bg-white/40"
            }`}
          />
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
        {last ? (
          <>
            <button
              type="button"
              onClick={finish}
              className="h-14 w-full rounded-2xl bg-white text-lg font-bold text-primary"
            >
              Mulai
            </button>
            <button
              type="button"
              onClick={tryDemo}
              className="min-h-12 w-full rounded-2xl text-base font-semibold text-white hover:bg-white/10"
            >
              Coba mode demo
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            className="h-14 w-full rounded-2xl bg-white text-lg font-bold text-primary"
          >
            Lanjut
          </button>
        )}
      </div>
    </div>
  );
}
