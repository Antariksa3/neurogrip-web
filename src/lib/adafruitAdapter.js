const mqtt = window.mqtt;
import axios from "axios";
import { MOTOR_STATE, EMPTY_TELEMETRY, DEFAULT_CONFIG } from "./bleContract";

const AIO_USERNAME = "itsmikoo";
const AIO_KEY = "aio_iZKQ78KpwIti62I11KMvJdTmxrHS";
const FEED_TELEMETRY = "neurogrip-telemetry";
const FEED_CONFIG = "neurogrip-config";

let mqttClient = null;
const telemetrySubs = new Set();
const eventSubs = new Set();
const disconnectSubs = new Set();

export const adafruitAdapter = {
  isMock: false,
  isCloud: true,

  async connect() {
    if (mqttClient?.connected)
      return { name: "Adafruit Cloud", firmware: "Cloud-v1" };

    return new Promise((resolve, reject) => {
      let hasConnected = false; 

      const timeout = setTimeout(() => {
        if (mqttClient) mqttClient.end();
        reject(new Error("Koneksi timeout. Periksa koneksi internet atau API Key."));
      }, 5000);

      mqttClient = mqtt.connect(`wss://io.adafruit.com:443/mqtt`, {
        username: AIO_USERNAME,
        password: AIO_KEY,
        clientId: "react_client_" + Math.random().toString(16).substring(2, 8),
        reconnectPeriod: 0, 
      });

      mqttClient.on("connect", () => {
        hasConnected = true;
        clearTimeout(timeout);
        mqttClient.subscribe(`${AIO_USERNAME}/feeds/${FEED_TELEMETRY}`);
        mqttClient.subscribe(`${AIO_USERNAME}/feeds/${FEED_CONFIG}`);
        resolve({ name: "Adafruit Cloud", firmware: "Cloud-v1" });
      });

      mqttClient.on("error", (err) => {
        clearTimeout(timeout);
        reject(new Error("Error server: " + err.message));
      });

      mqttClient.on("close", () => {
        clearTimeout(timeout);
        reject(new Error("Koneksi ditolak oleh Adafruit. (Mungkin limit API tercapai atau key salah)"));
        
        if (hasConnected) {
          disconnectSubs.forEach((cb) => cb());
        }
      });
    });
  },

  async disconnect() {
    if (mqttClient) {
      mqttClient.end();
      mqttClient = null;
    }
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
    try {
      const res = await axios.get(
        `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${FEED_CONFIG}/data/last`,
        {
          headers: { "X-AIO-Key": AIO_KEY },
        },
      );
      return JSON.parse(res.data.value);
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  },

  async writeConfig(next) {
    if (mqttClient?.connected) {
      mqttClient.publish(
        `${AIO_USERNAME}/feeds/${FEED_CONFIG}`,
        JSON.stringify(next),
      );
    }
    return next;
  },

  async getHistory() {
    try {
      const res = await axios.get(
        `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${FEED_TELEMETRY}/data?limit=20`,
        {
          headers: { "X-AIO-Key": AIO_KEY },
        },
      );

      const weeklyGrip = res.data.reverse().map((item) => {
        const date = new Date(item.created_at);
        const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });
        let forceVal = 0;
        try {
          forceVal = JSON.parse(item.value).force || 0;
        } catch {}
        return { day: dayName, value: forceVal };
      });

      return {
        weeklyGrip,
        sessionsThisWeek: res.data.length,
        avgGrip: Math.round(
          weeklyGrip.reduce((acc, curr) => acc + curr.value, 0) /
            (weeklyGrip.length || 1),
        ),
        changePercent: 0,
        autoStops: [],
      };
    } catch (err) {
      console.error("Gagal memuat riwayat dari Adafruit:", err);
      return {
        weeklyGrip: [],
        sessionsThisWeek: 0,
        avgGrip: 0,
        changePercent: 0,
        autoStops: [],
      };
    }
  },
};
