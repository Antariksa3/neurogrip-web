import mqtt from "mqtt";
import { DEFAULT_CONFIG, parseTelemetry } from "./bleContract";

const HIVEMQ_URL = import.meta.env.VITE_HIVEMQ_URL;
const USERNAME = import.meta.env.VITE_HIVEMQ_USERNAME;
const PASSWORD = import.meta.env.VITE_HIVEMQ_PASSWORD;

const TOPIC_TELEMETRY = "neurogrip/telemetry";
const TOPIC_EVENT = "neurogrip/event";

let client = null;
let config = { ...DEFAULT_CONFIG };

const telemetrySubs = new Set();
const eventSubs = new Set();
const disconnectSubs = new Set();

export const isSupported = () => true;

export const mqttAdapter = {
  isMock: false,

  async connect() {
    return new Promise((resolve, reject) => {
      client = mqtt.connect(HIVEMQ_URL, {
        username: USERNAME,
        password: PASSWORD,
        clientId: `neurogrip_web_${Math.random().toString(16).slice(3)}`,
      });

      client.on("connect", () => {
        client.subscribe([TOPIC_TELEMETRY, TOPIC_EVENT]);
        resolve({ name: "NeuroGrip Cloud", firmware: "v1.0-MQTT" });
      });

      client.on("error", (err) => {
        reject(new Error("Gagal terhubung ke HiveMQ: " + err.message));
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
        disconnectSubs.forEach((cb) => cb());
      });
    });
  },

  async disconnect() {
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
