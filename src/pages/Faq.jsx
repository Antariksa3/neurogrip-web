import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Bagaimana cara menghubungkan NeuroGrip pertama kali?",
    a: "Nyalakan sarung tangan NeuroGrip, lalu buka halaman Beranda dan ketuk \"Hubungkan sekarang\". Masukkan ID Perangkat yang tertulis pada sarung tangan, lalu ketuk tombol simpan. Aplikasi akan menyambung otomatis, cukup tunggu sampai status berubah menjadi Terhubung.",
  },
  {
    id: "offline",
    q: "Apa arti \"Perangkat offline\" padahal statusnya tersambung?",
    a: "Tersambung artinya ponsel Anda sudah terhubung ke internet dan server. Tetapi sarung tangannya sendiri mungkin belum menyala atau kehabisan baterai. Pastikan sarung tangan menyala dan dekat dengan Wi-Fi, lalu tunggu beberapa detik sampai peringatan hilang.",
  },
  {
    q: "Kenapa perubahan batas tekanan harus dikonfirmasi dulu?",
    a: "Batas tekanan menentukan kapan sarung tangan berhenti otomatis demi keamanan pasien. Kalau salah atur, sarung tangan bisa menekan terlalu kuat. Karena itu setiap perubahan harus Anda periksa dan setujui dulu sebelum dikirim ke sarung tangan.",
  },
  {
    q: "Kenapa sarung tangan berhenti sendiri dan berbunyi?",
    a: "Itu fitur keamanan auto-stop. Saat tekanan genggaman mencapai batas aman, sarung tangan berhenti menggerakkan jari, lalu ponsel bergetar dan berbunyi. Tidak ada yang rusak. Ketuk tombol tutup pada peringatan, istirahat sebentar, lalu lanjutkan latihan. Kejadian ini juga tercatat di Riwayat.",
  },
  {
    id: "sensor-kosong",
    q: "Kenapa angka sensor berubah jadi \"—\"?",
    a: "Aplikasi sengaja tidak menampilkan angka lama supaya Anda tidak salah baca. Ini terjadi kalau sarung tangan offline, sedang menyambung kembali, atau tidak mengirim data selama sekitar 10 detik. Timer sesi juga berhenti sementara dan jalan lagi saat data masuk kembali. Cek apakah sarung tangan menyala dan sinyal Wi-Fi bagus.",
  },
  {
    q: "Apa arti \"Menyambung kembali…\"?",
    a: "Koneksi internet sempat terputus dan aplikasi sedang mencoba menyambung sendiri. Anda tidak perlu berbuat apa-apa. Sesi latihan tidak hilang. Kalau lebih dari beberapa menit tidak berhasil, periksa internet ponsel Anda.",
  },
  {
    id: "gagal-terhubung",
    q: "Gagal terhubung, apa yang harus dilakukan?",
    a: "Pastikan internet ponsel aktif dan sarung tangan menyala. Lalu cek ID Perangkat di Pengaturan, karena satu huruf salah saja membuat aplikasi tidak bisa menemukan sarung tangan. Setelah itu ketuk \"Coba lagi\". Kalau masih gagal, hubungi terapis atau pihak yang menyiapkan alat Anda.",
  },
  {
    q: "Kenapa slider di halaman Kalibrasi tidak bisa digeser?",
    a: "Slider hanya aktif saat aplikasi terhubung ke sarung tangan, karena pengaturan harus benar-benar sampai ke alat. Sambungkan dulu dari Beranda, lalu kembali ke Kalibrasi.",
  },
  {
    q: "Perubahan kalibrasi belum saya simpan tapi mau pindah halaman, bagaimana?",
    a: "Aplikasi akan menahan Anda dan bertanya dulu. Pilih \"Lanjut mengedit\" untuk kembali, \"Simpan dulu\" untuk menyimpan lalu pindah, atau \"Buang perubahan\" kalau tidak jadi mengubah.",
  },
  {
    id: "baterai",
    q: "Apa yang harus dilakukan kalau baterai sarung tangan hampir habis?",
    a: "Aplikasi menampilkan peringatan saat baterai tinggal 20% atau kurang. Selesaikan gerakan yang sedang berjalan, lalu isi daya sarung tangan sebelum latihan berikutnya supaya sesi tidak terputus di tengah jalan.",
  },
  {
    q: "Di mana data riwayat latihan saya disimpan?",
    a: "Di ponsel atau browser yang Anda pakai, bukan di server. Artinya riwayat tidak muncul di ponsel lain, dan bisa hilang kalau data browser dihapus. Untuk arsip, unduh laporan PDF atau CSV dari halaman Riwayat.",
  },
  {
    q: "Bagaimana cara mengirim laporan ke dokter atau terapis?",
    a: "Buka Riwayat, lalu turun ke bagian ekspor. Pilih minggu yang diinginkan dan unduh PDF-nya. Kalau nama pasien belum diisi, akan muncul pop-up untuk mengisinya dulu supaya nama tercantum di laporan. Anda juga bisa membagikan ringkasan teks lewat WhatsApp.",
  },
  {
    q: "Tulisan terlalu kecil, bagaimana memperbesarnya?",
    a: "Buka Pengaturan lalu nyalakan \"Teks besar\". Tampilan teks dan tombol di seluruh aplikasi akan diperbesar.",
  },
];

export default function Faq() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const target = params.get("q");
  const [openIndex, setOpenIndex] = useState(() => {
    const i = FAQS.findIndex((f) => f.id === target);
    return i === -1 ? null : i;
  });

  useEffect(() => {
    if (target) document.getElementById(`faq-${target}`)?.scrollIntoView({ block: "start" });
  }, [target]);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 md:px-8 lg:px-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="grid size-11 shrink-0 place-items-center rounded-xl
                     text-foreground transition hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Bantuan & FAQ</h1>
      </header>

      <div className="space-y-3 px-5 py-5 md:px-8 lg:px-10">
        {FAQS.map((item, i) => {
          const open = openIndex === i;
          return (
            <section
              key={item.q}
              id={item.id && `faq-${item.id}`}
              className="scroll-mt-4 rounded-2xl border border-border bg-card"
            >
              <h2>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex min-h-11 w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-base font-bold text-foreground">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </h2>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden" inert={!open}>
                  <p className="px-5 pb-5 text-base leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
