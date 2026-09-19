import { DEFAULT_CONFIG, MOTOR_STATE } from "./bleContract";

const TICK_MS = 250;
const CYCLE_TICKS = 32;
const AUTOSTOP_EVERY = 4;

let config = { ...DEFAULT_CONFIG };
let timer = null;
let tick = 0;
let cycle = 0;
let batt = 86;

const telemetrySubs = new Set();
const eventSubs = new Set();
const disconnectSubs = new Set();
const reconnectSubs = new Set();
const qualitySubs = new Set();
const statusSubs = new Set();

const noise = (amp) => (Math.random() - 0.5) * 2 * amp;

function step() {
  const phase = tick / CYCLE_TICKS;
  const overshoot = (cycle + 1) % AUTOSTOP_EVERY === 0;
  const peak = overshoot ? config.threshold * 1.05 : config.threshold * 0.72;

  let force = 0;
  let emg = 8;
  let motor = MOTOR_STATE.IDLE;

  if (phase > 0.15 && phase < 0.85) {
    const p = (phase - 0.15) / 0.7;
    force = Math.sin(p * Math.PI) * peak;
    emg = 30 + Math.sin(p * Math.PI) * 55;
    motor = MOTOR_STATE.PULLING;
  }

  const locked = force >= config.threshold;
  if (locked) {
    force = config.threshold;
    motor = MOTOR_STATE.LOCKED;
  }

  const data = {
    emg: Math.max(0, Math.round(emg + noise(4))),
    force: Math.max(0, Math.round(force + (force > 0 ? noise(8) : 0))),
    motor,
    batt: Math.round(batt),
  };
  telemetrySubs.forEach((cb) => cb(data));

  if (locked && !step.fired) {
    step.fired = true;
    eventSubs.forEach((cb) =>
      cb({ type: "autostop", force: data.force, ts: Date.now() }),
    );
  }

  tick += 1;
  if (tick >= CYCLE_TICKS) {
    tick = 0;
    cycle += 1;
    step.fired = false;
    batt = Math.max(21, batt - 0.05);
  }
}
step.fired = false;

export const isSupported = () => true;

export const mockAdapter = {
  isMock: true,

  async connect() {
    await new Promise((r) => setTimeout(r, 1500));
    tick = 0;
    cycle = 0;
    step.fired = false;
    clearInterval(timer);
    timer = setInterval(step, TICK_MS);
    statusSubs.forEach((cb) => cb("online"));
    qualitySubs.forEach((cb) => cb("good"));
    return { name: "NeuroGrip Demo", firmware: "v1.0-DEMO" };
  },

  async disconnect() {
    clearInterval(timer);
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
  onReconnect(cb) {
    reconnectSubs.add(cb);
    return () => reconnectSubs.delete(cb);
  },
  onQuality(cb) {
    qualitySubs.add(cb);
    return () => qualitySubs.delete(cb);
  },
  onStatus(cb) {
    statusSubs.add(cb);
    return () => statusSubs.delete(cb);
  },

  onConfig() {
    return () => {};
  },

  async readConfig() {
    return { ...config };
  },

  async writeConfig(next) {
    config = { ...config, ...next };
    return { ...config };
  },

  async getHistory() {
    return {
      weeklyGrip: [],
      sessionsThisWeek: 0,
      avgGrip: 0,
      changePercent: 0,
      autoStops: [],
    };
  },
};
