import { useNavigate } from "react-router-dom";
import { useNeuroGrip } from "@/hooks/NeuroGripProvider";
import ConnectCard from "@/components/ConnectCard";
import UnsupportedBrowser from "@/components/UnsupportedBrowser";

export default function Connect() {
  const { status, error, device, connect, isSupported } = useNeuroGrip();
  const navigate = useNavigate();

  if (!isSupported) return <UnsupportedBrowser />;

  return (
    <main
      className="flex-1 flex flex-col items-center justify-center px-6 py-10
                 bg-gradient-to-b from-[#0F6E56] to-[#0A4A3A]"
    >
      <div className="grid place-items-center size-36 rounded-full bg-white/10 mb-7">
        <div className="grid place-items-center size-24 rounded-full bg-white/10">
          <BluetoothIcon />
        </div>
      </div>

      <h1 className="text-[28px] font-bold text-white text-center leading-tight">
        NeuroGrip Monitor
      </h1>

      <p className="mt-3 mb-9 max-w-[19rem] text-center text-[17px] leading-relaxed text-white/80">
        Sambungkan ke jaringan Bluetooth yang dipancarkan langsung oleh sarung
        tangan NeuroGrip Anda
      </p>

      <ConnectCard
        status={status}
        error={error}
        deviceName={device?.name ?? "NeuroGrip-Glove-01"}
        onConnect={connect}
        onContinue={() => navigate("/dashboard")}
      />
    </main>
  );
}

function BluetoothIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-9"
      aria-hidden="true"
    >
      <path d="m7 7 10 10-5 5V2l5 5L7 17" />
    </svg>
  );
}
