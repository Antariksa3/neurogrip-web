let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

export function playAlertTone() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") ctx.resume();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {}
}

export function vibrate(pattern) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function notifyAutoStop() {
  // Pendamping pasien mungkin sedang tidak melihat layar (fokus memegang
  // tangan pasien) — getar & bunyi diulang beberapa kali supaya tetap terasa.
  vibrate([200, 100, 200, 100, 200, 100, 200]);
  playAlertTone();
  setTimeout(playAlertTone, 500);
  setTimeout(playAlertTone, 1000);
}
