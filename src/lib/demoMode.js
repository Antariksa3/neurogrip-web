import { clearDemoHistory, seedDemoHistory } from "@/lib/history/demoSeed";

const DEMO_KEY = "neurogrip-demo";

function resolveDemo() {
  try {
    const param = new URLSearchParams(window.location.search).get("demo");
    if (param === "1") localStorage.setItem(DEMO_KEY, "1");
    if (param === "0") localStorage.removeItem(DEMO_KEY);
    return localStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
}

export const isDemoMode = resolveDemo();

const REC_KEY = "neurogrip-rec";

function resolveRecording() {
  try {
    const param = new URLSearchParams(window.location.search).get("rec");
    if (param === "1") localStorage.setItem(REC_KEY, "1");
    if (param === "0") localStorage.removeItem(REC_KEY);
    return localStorage.getItem(REC_KEY) === "1";
  } catch {
    return false;
  }
}

export const isRecordingMode = resolveRecording() && isDemoMode;

if (isDemoMode) {
  seedDemoHistory().catch((err) => {
    console.error("Gagal mengisi riwayat demo:", err);
  });
} else if (new URLSearchParams(window.location.search).get("demo") === "0") {
  clearDemoHistory().catch(() => {});
}

export async function exitDemoMode() {
  localStorage.removeItem(DEMO_KEY);
  await clearDemoHistory().catch(() => {});
  window.location.href = window.location.pathname;
}
