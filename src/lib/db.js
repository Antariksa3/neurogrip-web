import Dexie from "dexie";

export const db = new Dexie("neurogrip-db");

// v1: sessions = ringkasan tiap sesi latihan, autoStops = tiap kali alat berhenti otomatis
db.version(1).stores({
  sessions: "++id, startedAt, endedAt",
  autoStops: "++id, ts",
});

export default db;