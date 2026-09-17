import { DEFAULT_CONFIG, MOTOR_STATE } from "./bleContract";

const TICK_MS = 100;
const CYCLE_S = 12;

let config = { ...DEFAULT_CONFIG };
let timer = null;
let startedAt = 0;
let batt = 72;
let firedThisCycle = false;

const telemetrySubs = new Set();
const eventSubs = new Set();
const disconnectSubs = new Set();

const lerp = (from, to, t) => from + (to - from) * Math.min(Math.max(t, 0), 1);

const wobble = (elapsed, amp) => Math.sin(elapsed * 7) * amp;

function sample(elapsed) {
  const phase = elapsed % CYCLE_S;
  let emg, force, motor;

  if (phase < 3) {
    emg = 10 + wobble(elapsed, 4);
    force = 0;
    motor = MOTOR_STATE.IDLE;
  } else if (phase < 4) {
    emg = lerp(10, 70, phase - 3) + wobble(elapsed, 3);
    force = 0;
    motor = MOTOR_STATE.PULLING;
  } else if (phase < 8) {
    emg = 70 + wobble(elapsed, 5);
    force = lerp(0, config.threshold * 1.15, (phase - 4) / 4);
    motor =
      force >= config.threshold ? MOTOR_STATE.LOCKED : MOTOR_STATE.PULLING;
    force = Math.min(force, config.threshold);
  } else if (phase < 10) {
    emg = lerp(70, 10, (phase - 8) / 2) + wobble(elapsed, 3);
    force = lerp(config.threshold, 0, (phase - 8) / 2);
    motor = MOTOR_STATE.IDLE;
  } else {
    emg = 10 + wobble(elapsed, 4);
    force = 0;
    motor = MOTOR_STATE.IDLE;
  }

  return {
    emg: Math.round(Math.max(0, Math.min(100, emg))),
    force: Math.round(Math.max(0, force)),
    motor,
    batt: Math.round(batt),
  };
}

function tick() {
  const elapsed = (Date.now() - startedAt) / 1000;
  const data = sample(elapsed);

  if (data.motor === MOTOR_STATE.LOCKED && !firedThisCycle) {
    firedThisCycle = true;
    const payload = {
      type: "autostop",
      force: data.force,
      ts: Date.now(),
    };
    eventSubs.forEach((cb) => cb(payload));
  }
  if (data.motor === MOTOR_STATE.IDLE) firedThisCycle = false;

  batt = Math.max(0, batt - TICK_MS / 60000);
  telemetrySubs.forEach((cb) => cb(data));

  //   console.log(Date.now());
}

export const mockAdapter = {
  isMock: true,

  async connect() {
    await new Promise((r) => setTimeout(r, 800));
    startedAt = Date.now();
    firedThisCycle = false;
    batt = 72;
    if (timer) clearInterval(timer);
    timer = setInterval(tick, TICK_MS);
    return { name: "NeuroGrip-Glove-01", firmware: "v2.4.1" };
  },

  async disconnect() {
    if (timer) clearInterval(timer);
    timer = null;
    disconnectSubs.forEach((cb) => cb());
  },

  onTelemetry(cb) {
    telemetrySubs.add(cb);
    return () => telemetrySubs.delete(cb);
  },

  onEvent(cb) {
    eventSubs.add(cb);
    return () => eventSubs.delete(cb);
  },

  onDisconnect(cb) {
    disconnectSubs.add(cb);
    return () => disconnectSubs.delete(cb);
  },

  async readConfig() {
    return { ...config };
  },

  async writeConfig(next) {
    await new Promise((r) => setTimeout(r, 400));
    config = { ...config, ...next };
    return { ...config };
  },
};