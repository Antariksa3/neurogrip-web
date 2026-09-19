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

export function exitDemoMode() {
  localStorage.removeItem(DEMO_KEY);
  window.location.href = window.location.pathname;
}
