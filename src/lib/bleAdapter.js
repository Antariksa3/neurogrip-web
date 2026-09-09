import {
  CHAR_CONFIG,
  CHAR_EVENT,
  CHAR_TELEMETRY,
  DEVICE_NAME_PREFIX,
  DEFAULT_CONFIG,
  SERVICE_UUID,
  parseTelemetry,
} from "./bleContract";

let device = null;
let server = null;
let chars = {};

const telemetrySubs = new Set();
const eventSubs = new Set();
const disconnectSubs = new Set();

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export const isSupported = () =>
  typeof navigator !== "undefined" && !!navigator.bluetooth;

function handleTelemetry(e) {
  const data = parseTelemetry(decoder.decode(e.target.value));
  if (data) telemetrySubs.forEach((cb) => cb(data));
}

function handleEvent(e) {
  try {
    const payload = JSON.parse(decoder.decode(e.target.value));
    eventSubs.forEach((cb) => cb(payload));
  } catch {}
}

function handleDisconnect() {
  chars.telemetry?.removeEventListener(
    "characteristicvaluechanged",
    handleTelemetry,
  );
  chars.event?.removeEventListener("characteristicvaluechanged", handleEvent);
  device?.removeEventListener("gattserverdisconnected", handleDisconnect);
  server = null;
  chars = {};
  disconnectSubs.forEach((cb) => cb());
}

export const bleAdapter = {
  isMock: false,

  async connect() {
    if (!isSupported()) {
      throw new Error("Browser ini tidak mendukung Bluetooth.");
    }

    device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: DEVICE_NAME_PREFIX }],
      optionalServices: [SERVICE_UUID],
    });

    device.addEventListener("gattserverdisconnected", handleDisconnect);

    server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);

    chars.telemetry = await service.getCharacteristic(CHAR_TELEMETRY);
    chars.config = await service.getCharacteristic(CHAR_CONFIG);
    chars.event = await service.getCharacteristic(CHAR_EVENT);

    await chars.telemetry.startNotifications();
    chars.telemetry.addEventListener(
      "characteristicvaluechanged",
      handleTelemetry,
    );

    await chars.event.startNotifications();
    chars.event.addEventListener("characteristicvaluechanged", handleEvent);

    return { name: device.name, firmware: "—" };
  },

  async disconnect() {
    if (device?.gatt?.connected) device.gatt.disconnect();
    else handleDisconnect();
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
    if (!chars.config) return { ...DEFAULT_CONFIG };
    const value = await chars.config.readValue();
    try {
      return JSON.parse(decoder.decode(value));
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  },

  async writeConfig(next) {
    if (!chars.config) throw new Error("Perangkat belum tersambung.");
    await chars.config.writeValueWithResponse(
      encoder.encode(JSON.stringify(next)),
    );
    return next;
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
