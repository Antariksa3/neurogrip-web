import mqtt from "mqtt";
import { DEFAULT_CONFIG, parseTelemetry } from "./bleContract";

const HIVEMQ_URL = import.meta.env.VITE_HIVEMQ_URL;
const USERNAME = import.meta.env.VITE_HIVEMQ_USERNAME;
const PASSWORD = import.meta.env.VITE_HIVEMQ_PASSWORD;

// Fallback id for devices provisioned before multi-device support existed;
// keeps them reachable on their original topic namespace without a firmware
// update, instead of silently going dark when Settings has no device id set.
const DEFAULT_DEVICE_ID = "glove-01";
const CONNECT_TIMEOUT_MS = 10000;

const topicTelemetry = (deviceId) => `neurogrip/${deviceId}/telemetry`;
const topicEvent = (deviceId) => `neurogrip/${deviceId}/event`;
const topicConfig = (deviceId) => `neurogrip/${deviceId}/config`;
const topicStatus = (deviceId) => `neurogrip/${deviceId}/status`;

let client = null;
let config = { ...DEFAULT_CONFIG };
let manualDisconnect = false;
let hasConnectedOnce = false;
let activeDeviceId = DEFAULT_DEVICE_ID;

const telemetrySubs = new Set();
const eventSubs = new Set();
const disconnectSubs = new Set();
const reconnectSubs = new Set();
const qualitySubs = new Set();
const statusSubs = new Set();

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

  async connect(deviceId = DEFAULT_DEVICE_ID) {
    manualDisconnect = false;
    hasConnectedOnce = false;
    activeDeviceId = deviceId;

    return new Promise((resolve, reject) => {
      let settled = false;

      const fail = (message) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        manualDisconnect = true;
        client?.end(true);
        reject(new Error(message));
      };

      const timeoutId = setTimeout(() => {
        fail(
          "Gagal terhubung ke HiveMQ: waktu koneksi habis. Periksa kredensial dan koneksi jaringan.",
        );
      }, CONNECT_TIMEOUT_MS);

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
        client.subscribe([
          topicTelemetry(deviceId),
          topicEvent(deviceId),
          topicStatus(deviceId),
        ]);
        if (!hasConnectedOnce) {
          hasConnectedOnce = true;
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            resolve({ name: "NeuroGrip Cloud", firmware: "v1.0-MQTT" });
          }
        } else {
          reconnectSubs.forEach((cb) => cb(false));
        }
      });

      client.on("reconnect", () => {
        reconnectSubs.forEach((cb) => cb(true));
      });

      client.on("error", (err) => {
        if (!hasConnectedOnce) {
          fail("Gagal terhubung ke HiveMQ: " + err.message);
        } else {
          console.error("Kesalahan koneksi MQTT:", err.message);
        }
      });

      client.on("message", (topic, message) => {
        const payload = message.toString();

        if (topic === topicTelemetry(activeDeviceId)) {
          const data = parseTelemetry(payload);
          if (data) telemetrySubs.forEach((cb) => cb(data));
        } else if (topic === topicEvent(activeDeviceId)) {
          try {
            const evt = JSON.parse(payload);
            eventSubs.forEach((cb) => cb(evt));
          } catch (e) {
            console.error("Gagal parsing event:", e);
          }
        } else if (topic === topicStatus(activeDeviceId)) {
          statusSubs.forEach((cb) => cb(payload));
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

  onStatus(cb) {
    statusSubs.add(cb);
    return () => statusSubs.delete(cb);
  },

  async readConfig() {
    return { ...config };
  },

  async writeConfig(next) {
    const merged = { ...config, ...next };
    return new Promise((resolve, reject) => {
      if (!client?.connected) {
        reject(new Error("Tidak dapat menyimpan konfigurasi: perangkat tidak tersambung."));
        return;
      }
      client.publish(topicConfig(activeDeviceId), JSON.stringify(merged), { qos: 1 }, (err) => {
        if (err) {
          reject(new Error("Gagal mengirim konfigurasi ke perangkat: " + err.message));
          return;
        }
        config = merged;
        resolve({ ...config });
      });
    });
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
