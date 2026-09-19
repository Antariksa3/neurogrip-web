# NeuroGrip Web

Dashboard web untuk **NeuroGrip**, sarung tangan rehabilitasi bertenaga EMG untuk
pasien pasca-stroke. Aplikasi ini dipakai oleh pendamping/keluarga pasien untuk
memantau sesi terapi genggam, mengatur kalibrasi sensor, dan melihat riwayat
progres pasien dari waktu ke waktu.

Device (ESP32 + sensor EMG) terhubung ke aplikasi melalui **MQTT (HiveMQ)**,
bukan koneksi langsung Bluetooth dari browser.

## Fitur utama

- **Dashboard**: status koneksi device real-time (termasuk indikator terpisah
  saat perangkat offline meski koneksi MQTT masih tersambung), sensor tekanan
  & EMG saat ini, kontrol sesi terapi (mulai/jeda/berhenti), dan ringkasan
  progres harian dibanding hari sebelumnya. Saat menghubungkan device baru
  (belum ada ID Perangkat tersimpan), muncul dialog pemasangan pertama untuk
  memasukkan ID Perangkat sebelum tersambung.
- **Kalibrasi sensor**: atur sensitivitas deteksi genggaman (EMG) dan batas
  tekanan aman (auto-stop). Perubahan batas tekanan wajib melalui dialog
  konfirmasi karena ini parameter keselamatan pasien. Banner "Perubahan belum
  disimpan" tampil selama ada perubahan yang belum dikirim; keluar halaman
  (tombol kembali, tab bawah, back browser/HP) ditahan dengan pilihan "Lanjut
  mengedit" / "Simpan dulu" / "Buang perubahan", dan refresh/tutup tab memicu
  peringatan bawaan browser. Halaman ini juga memberi tahu bila perangkat belum
  tersambung, sarung tangan sedang offline, atau angka yang tampil belum dibaca
  dari perangkat.
- **Dashboard**: banner besar "Sarung tangan tidak aktif" tampil saat
  perangkat offline, banner "Data dari sarung tangan berhenti masuk" saat
  status online tapi tidak ada data selama 10 detik, dan banner baterai
  hampir habis (<= 20%). Kartu sensor menampilkan "—" (bukan angka lama) saat
  data tidak live. Kalau broker menolak akses topik perangkat (ID Perangkat /
  ACL salah), koneksi gagal dengan pesan jelas.
- **Navigasi mobile**: bottom navigation 4 tab (Beranda, Riwayat, Kalibrasi,
  Pengaturan); di tablet/desktop tetap memakai tombol di Dashboard.
- **Riwayat**: statistik mingguan/harian sesi terapi, grafik kekuatan
  genggaman, badge streak hari berturut-turut, dan ekspor laporan:
  - Unduh **PDF** per minggu (dengan grafik), bisa memilih minggu mana lewat
    navigasi periode.
  - Unduh **CSV**.
  - Bagikan ringkasan progres ke **WhatsApp** (teks saja).
- **Pengaturan**: nama pasien (ikut tercantum di laporan PDF), ID Perangkat
  untuk mendukung lebih dari satu NeuroGrip di broker MQTT yang sama, toggle
  teks besar untuk aksesibilitas, reset kalibrasi ke default pabrik, dan
  putus koneksi device (memutuskan koneksi juga menghapus ID Perangkat
  tersimpan, jadi koneksi berikutnya kembali lewat dialog pemasangan
  pertama).
- **Notifikasi auto-stop**: saat device berhenti otomatis karena tekanan
  berlebih, aplikasi menampilkan alert visual yang persisten (tidak hilang
  sendiri) plus getar & bunyi berulang, karena pendamping sering tidak
  sedang melihat layar.

## Tech stack

- [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) dengan konvensi
  [shadcn](https://ui.shadcn.com/) (tanpa TypeScript)
- [react-router-dom](https://reactrouter.com/) untuk routing
- [mqtt.js](https://github.com/mqttjs/MQTT.js) untuk koneksi ke device via
  HiveMQ
- [Dexie](https://dexie.org/) (IndexedDB) untuk penyimpanan riwayat sesi
  secara lokal di browser
- [jsPDF](https://github.com/parallax/jsPDF) + jspdf-autotable untuk laporan
  PDF
- [recharts](https://recharts.org/) untuk grafik di halaman Riwayat
- [oxlint](https://oxc.rs/docs/guide/usage/linter.html) untuk linting

## Menjalankan project

Butuh Node.js dan sebuah broker MQTT (HiveMQ Cloud atau lainnya) yang sudah
dikonfigurasi untuk device NeuroGrip.

```bash
npm install
```

Buat file `.env` di root project (jangan di-commit) dengan kredensial MQTT:

```
VITE_HIVEMQ_URL=wss://<host-hivemq-anda>:8884/mqtt
VITE_HIVEMQ_USERNAME=<username>
VITE_HIVEMQ_PASSWORD=<password>
```

Lalu jalankan:

```bash
npm run dev       # dev server (default http://localhost:5173)
npm run build     # build production ke folder dist/
npm run preview   # preview hasil build
npm run lint      # cek lint dengan oxlint
```

> Catatan: tanpa koneksi MQTT/device fisik yang aktif, halaman Dashboard tidak
> akan menerima data telemetry live. Halaman lain (Kalibrasi, Settings,
> Riwayat) tetap bisa dijalankan dan dilihat karena datanya berasal dari
> IndexedDB lokal / bentuk statis UI.

**Mode demo (tanpa device):** buka aplikasi dengan `?demo=1`, misalnya
`http://localhost:5173/?demo=1`. Data glove disimulasikan (`mockAdapter.js`) dan riwayat latihan contoh
(±3 minggu) diisi otomatis; data contoh dihapus saat keluar dari mode demo.
Matikan lewat tombol "Keluar" di banner atau buka `?demo=0`.

## Struktur folder

```
src/
├── pages/              Halaman utama (Dashboard, History, Calibration, Settings, ...)
├── components/         Komponen UI reusable (ErrorCard, StatCard, AutoStopAlert, dst.)
│   └── history/        Komponen khusus halaman Riwayat (WeeklyView, DailyView, ExportSection, ...)
├── hooks/               useNeuroGrip (state device/telemetry/config/sesi), useTextScale, dll.
├── lib/
│   ├── mqttAdapter.js   Adapter koneksi device via MQTT (transport aktif)
│   ├── bleAdapter.js    Adapter Web Bluetooth (disimpan untuk kemungkinan revert, tidak dipakai)
│   ├── bleContract.js   Skema bersama: UUID karakteristik, default & batas config, parseTelemetry()
│   ├── db.js            Setup Dexie (IndexedDB)
│   ├── historyRepo.js   Query & agregasi riwayat sesi/statistik dari IndexedDB
│   ├── reportPdf.js     Generator laporan PDF (termasuk grafik canvas)
│   ├── reportCsv.js     Generator laporan CSV
│   └── feedback.js      Getar + bunyi untuk notifikasi auto-stop
└── App.jsx              Routing & NeuroGripProvider (state global)
```

## Arsitektur singkat

- Konektivitas device ada di balik satu interface (`connect`, `disconnect`,
  `onTelemetry`, `onEvent`, `readConfig`, `writeConfig`, dll.) yang
  diimplementasikan oleh `mqttAdapter.js` (aktif) dan `bleAdapter.js` (tidak
  dipakai). Mengganti transport berarti mengubah import di
  `src/hooks/useNeuroGrip.js`, tidak ada pemilihan runtime.
- Riwayat sesi **tidak** bergantung pada koneksi device, semuanya disimpan
  dan dihitung secara lokal lewat Dexie/IndexedDB (`historyRepo.js`), jadi
  halaman Riwayat tetap bisa dipakai walau device sedang offline.
- State koneksi/telemetry/config dan timer sesi terapi dikelola satu tempat
  (`useNeuroGrip` context, dipasang sekali di root `App.jsx`) supaya tidak
  reset saat berpindah halaman. Timer & pencatatan sampel sesi otomatis
  berhenti selama sarung tangan offline / koneksi sedang putus, dan sesi
  disimpan berkala (checkpoint tiap 30 detik + saat tab disembunyikan) supaya
  tidak hilang kalau tab ditutup sebelum sesi dihentikan.
- Config perangkat dibaca lewat pesan *retained* di topic `.../config`
  (`onConfig`), bukan tebakan lokal; `writeConfig` juga publish dengan
  `retain: true` supaya sarung tangan yang sedang mati menerimanya begitu
  menyala. Firmware perlu subscribe topic itu dan publish config aktifnya
  (retained) ke topic yang sama.
- Bunyi/getar & banner auto-stop dipicu di `useNeuroGrip` (sekali per event),
  bukan di Dashboard, jadi tidak berulang tiap Dashboard dibuka ulang.
- Router memakai `createBrowserRouter` (data router) karena `useBlocker`
  hanya berfungsi di sana.
- Perubahan batas tekanan (parameter keselamatan) selalu lewat dialog
  konfirmasi (`ConfirmDialog`) dan benar-benar dikirim ke device, tidak
  pernah hanya disimpan secara lokal.
- Mendukung banyak device lewat topic MQTT yang dinamis: `neurogrip/<ID
  Perangkat>/telemetry|event|config|status`. ID Perangkat diatur di halaman
  Pengaturan (atau lewat dialog pemasangan pertama di Dashboard) dan disimpan
  di `localStorage`; jika kosong, dipakai ID default supaya device lama
  (sebelum fitur ini ada) tetap tersambung tanpa perlu update firmware.
- Status hidup/mati device dipantau lewat topic `neurogrip/<ID
  Perangkat>/status` (payload teks `online`/`offline`), terpisah dari status
  koneksi MQTT itu sendiri — supaya UI bisa membedakan "aplikasi tersambung
  ke broker" dari "perangkat fisiknya benar-benar menyala dan mengirim data".

## Keterbatasan saat ini

- Belum ada test runner.
- Mode demo (`?demo=1`) memakai data simulasi, bukan data pasien nyata.
- Web Bluetooth tidak dipakai secara sengaja karena tidak didukung di
  Safari/iOS, konsekuensinya aplikasi tidak sepenuhnya offline/no-cloud
  (hanya loop refleks auto-stop di sisi ESP32 yang benar-benar lokal).
