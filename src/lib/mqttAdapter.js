import mqtt from "mqtt";
import { DEFAULT_CONFIG, parseTelemetry } from "./bleContract";

const HIVEMQ_URL = import.meta.env.VITE_HIVEMQ_URL;
const USERNAME = import.meta.env.VITE_HIVEMQ_USERNAME;
const PASSWORD = import.meta.env.VITE_HIVEMQ_PASSWORD;

const TOPIC_TELEMETRY = "neurogrip/telemetry";
const TOPIC_EVENT = "neurogrip/event";

let client = null;
let config = { ...DEFAULT_CONFIG };
let manualDisconnect = false;
let hasConnectedOnce = false;

const telemetrySubs = new Set();
const eventSubs = new Set();
const disconnectSubs = new Set();
const reconnectSubs = new Set();
const qualitySubs = new Set();

let lastPingSentAt = null;

// MQTT tidak punya RSSI seperti BLE, jadi "kekuatan sinyal" di sini didekati
// dari latensi PINGREQ→PINGRESP (keepalive) — indikator kualitas koneksi
// yang jujur untuk transport berbasis broker, bukan sinyal radio asli.
function classifyLatency(ms) {
  if (ms < 400) return "good";
  if (ms < 1200) return "fair";
  return "poor";
}

export const isSupported = () => true;

export const mqttAdapter = {
  isMock: false,

  async connect() {
    manualDisconnect = false;
    hasConnectedOnce = false;

    return new Promise((resolve, reject) => {
      client = mqtt.connect(HIVEMQ_URL, {
        username: USERNAME,
        password: PASSWORD,
        clientId: `neurogrip_web_${Math.random().toString(16).slice(3)}`,
        reconnectPeriod: 2000,
        keepalive: 15,
      });

      client.on("packetsend", (packet) => {
        if (packet.cmd === "pingreq") lastPingSentAt = Date.now();
      });

      client.on("packetreceive", (packet) => {
        if (packet.cmd === "pingresp" && lastPingSentAt != null) {
          const latency = Date.now() - lastPingSentAt;
          lastPingSentAt = null;
          qualitySubs.forEach((cb) => cb(classifyLatency(latency)));
        }
      });

      client.on("connect", () => {
        client.subscribe([TOPIC_TELEMETRY, TOPIC_EVENT]);
        if (!hasConnectedOnce) {
          hasConnectedOnce = true;
          resolve({ name: "NeuroGrip Cloud", firmware: "v1.0-MQTT" });
        } else {
          reconnectSubs.forEach((cb) => cb(false));
        }
      });

      client.on("reconnect", () => {
        reconnectSubs.forEach((cb) => cb(true));
      });

      client.on("error", (err) => {
        if (!hasConnectedOnce) {
          manualDisconnect = true;
          client?.end(true);
          reject(new Error("Gagal terhubung ke HiveMQ: " + err.message));
        } else {
          console.error("Kesalahan koneksi MQTT:", err.message);
        }
      });

      client.on("message", (topic, message) => {
        const payload = message.toString();

        if (topic === TOPIC_TELEMETRY) {
          const data = parseTelemetry(payload);
          if (data) telemetrySubs.forEach((cb) => cb(data));
        } else if (topic === TOPIC_EVENT) {
          try {
            const evt = JSON.parse(payload);
            eventSubs.forEach((cb) => cb(evt));
          } catch (e) {
            console.error("Gagal parsing event:", e);
          }
        }
      });

      client.on("close", () => {
        if (manualDisconnect) {
          disconnectSubs.forEach((cb) => cb());
        }
      });
    });
  },

  async disconnect() {
    manualDisconnect = true;
    lastPingSentAt = null;
    if (client) {
      client.end();
      client = null;
    }
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
