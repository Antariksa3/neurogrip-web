import mqtt from "mqtt";
import { DEFAULT_CONFIG, parseConfig, parseTelemetry } from "./bleContract";

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
let activeDeviceId = DEFAULT_DEVICE_ID;

const telemetrySubs = new Set();
const eventSubs = new Set();
const disconnectSubs = new Set();
const reconnectSubs = new Set();
const qualitySubs = new Set();
const statusSubs = new Set();
const configSubs = new Set();

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
  // Config yang benar baru diketahui setelah pesan retained di topik config
  // masuk (lewat onConfig), bukan saat connect() selesai.
  awaitsConfig: true,

  async connect(deviceId = DEFAULT_DEVICE_ID) {
    if (client) {
      const stale = client;
      client = null;
      stale.end(true);
    }
    activeDeviceId = deviceId;
    config = { ...DEFAULT_CONFIG };
    lastPingSentAt = null;

    return new Promise((resolve, reject) => {
      let settled = false;
      let connectedOnce = false;

      // Semua handler dibatasi ke client-nya sendiri (`live()`), supaya event
      // telat dari client lama (mis. `close` setelah disconnect + connect ulang
      // saat ganti device id) tidak menimpa state koneksi yang baru.
      const fail = (message) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        if (client === c) client = null;
        c.end(true);
        reject(new Error(message));
      };

      const timeoutId = setTimeout(() => {
        fail(
          "Gagal terhubung ke HiveMQ: waktu koneksi habis. Periksa kredensial dan koneksi jaringan.",
        );
      }, CONNECT_TIMEOUT_MS);

      const c = mqtt.connect(HIVEMQ_URL, {
        username: USERNAME,
        password: PASSWORD,
        clientId: `neurogrip_web_${Math.random().toString(16).slice(3)}`,
        reconnectPeriod: 2000,
        keepalive: 15,
      });
      client = c;
      const live = () => client === c;

      c.on("packetsend", (packet) => {
        if (live() && packet.cmd === "pingreq") lastPingSentAt = Date.now();
      });

      c.on("packetreceive", (packet) => {
        if (live() && packet.cmd === "pingresp" && lastPingSentAt != null) {
          const latency = Date.now() - lastPingSentAt;
          lastPingSentAt = null;
          qualitySubs.forEach((cb) => cb(classifyLatency(latency)));
        }
      });

      c.on("connect", () => {
        if (!live()) return;
        const firstConnect = !connectedOnce;
        connectedOnce = true;

        // Resolve baru setelah SUBACK: broker yang menolak subscribe (ACL /
        // ID Perangkat salah) tidak boleh terlihat "tersambung" tapi diam.
        c.subscribe(
          [
            topicTelemetry(deviceId),
            topicEvent(deviceId),
            topicStatus(deviceId),
            topicConfig(deviceId),
          ],
          (err, granted) => {
            if (!live()) return;
            const denied = err || granted?.some((g) => g.qos === 128);
            if (denied) {
              const message =
                "Broker menolak akses ke topik perangkat. Periksa ID Perangkat dan izin akun HiveMQ.";
              if (firstConnect) fail(message);
              else console.error(message, err?.message ?? "");
              return;
            }
            if (firstConnect && !settled) {
              settled = true;
              clearTimeout(timeoutId);
              resolve({ name: "NeuroGrip Cloud", firmware: "v1.0-MQTT" });
            }
          },
        );
        if (!firstConnect) reconnectSubs.forEach((cb) => cb(false));
      });

      c.on("reconnect", () => {
        if (live() && connectedOnce) reconnectSubs.forEach((cb) => cb(true));
      });

      c.on("error", (err) => {
        if (!live()) return;
        if (!connectedOnce) {
          fail("Gagal terhubung ke HiveMQ: " + err.message);
        } else {
          console.error("Kesalahan koneksi MQTT:", err.message);
        }
      });

      c.on("message", (topic, message) => {
        if (!live()) return;
        const payload = message.toString();

        if (topic === topicTelemetry(deviceId)) {
          const data = parseTelemetry(payload);
          if (data) telemetrySubs.forEach((cb) => cb(data));
        } else if (topic === topicEvent(deviceId)) {
          try {
            const evt = JSON.parse(payload);
            eventSubs.forEach((cb) => cb(evt));
          } catch (e) {
            console.error("Gagal parsing event:", e);
          }
        } else if (topic === topicStatus(deviceId)) {
          statusSubs.forEach((cb) => cb(payload));
        } else if (topic === topicConfig(deviceId)) {
          const next = parseConfig(payload);
          if (next) {
            config = { ...config, ...next };
            configSubs.forEach((cb) => cb({ ...config }));
          }
        }
      });
    });
  },

  async disconnect() {
    lastPingSentAt = null;
    const c = client;
    if (!c) return;
    client = null;
    await Promise.race([
      new Promise((resolve) => c.end(false, {}, resolve)),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
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

  onConfig(cb) {
    configSubs.add(cb);
    return () => configSubs.delete(cb);
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
      client.publish(topicConfig(activeDeviceId), JSON.stringify(merged), { qos: 1, retain: true }, (err) => {
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
