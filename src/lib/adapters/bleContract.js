export const DEVICE_NAME_PREFIX = "NeuroGrip";
export const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
export const CHAR_TELEMETRY = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
export const CHAR_CONFIG = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
export const CHAR_EVENT = "6e400004-b5a3-f393-e0a9-e50e24dcca9e";

export const MOTOR_STATE = {
  IDLE: "idle",
  PULLING: "pulling",
  LOCKED: "locked",
};

export const AUTO_STOP_WEEKLY_LIMIT = 3;

export const DEFAULT_CONFIG = {
  threshold: 400,
  sensitivity: 55,
};

export const CONFIG_LIMITS = {
  threshold: { min: 200, max: 600, step: 10 },
  sensitivity: { min: 0, max: 100, step: 5 },
};

export const EMPTY_TELEMETRY = {
  emg: 0,
  force: 0,
  motor: MOTOR_STATE.IDLE,
  batt: 0,
};

export function parseConfig(text) {
  try {
    const raw = JSON.parse(text);
    const threshold = Number(raw.threshold);
    const sensitivity = Number(raw.sensitivity);
    if (!Number.isFinite(threshold) || !Number.isFinite(sensitivity)) return null;
    return { threshold, sensitivity };
  } catch {
    return null;
  }
}

export function parseTelemetry(text) {
  try {
    const raw = JSON.parse(text);
    return {
      emg: Number(raw.emg) || 0,
      force: Number(raw.force) || 0,
      motor: raw.motor ?? MOTOR_STATE.IDLE,
      batt: Number(raw.batt) || 0,
    };
  } catch {
    return null;
  }
}
