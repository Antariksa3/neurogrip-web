export default function UnsupportedBrowser() {
  return (
    <main
      className="flex-1 flex flex-col items-center justify-center px-6 py-10
                     bg-gradient-to-b from-[#0F6E56] to-[#0A4A3A]"
    >
      <h1 className="text-[26px] font-bold text-white text-center leading-tight">
        Browser belum didukung
      </h1>
      <p className="mt-3 mb-8 max-w-[20rem] text-center text-[17px] leading-relaxed text-white/80">
        NeuroGrip Monitor membutuhkan Bluetooth dari browser, yang belum
        tersedia di browser ini.
      </p>

      <div className="w-full max-w-[21rem] rounded-3xl bg-card px-5 py-6">
        <p className="text-[15px] font-semibold text-foreground">
          Silakan buka lewat:
        </p>
        <ul className="mt-3 space-y-2 text-[15px] text-muted-foreground">
          <li>· Google Chrome di HP Android</li>
          <li>· Microsoft Edge atau Chrome di komputer</li>
        </ul>
        <p className="mt-4 text-[14px] text-muted-foreground">
          Safari di iPhone dan iPad belum mendukung fitur ini.
        </p>
      </div>
    </main>
  );
}
