export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(227,6,20,0.08),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(0,72,180,0.08),transparent_35%)]" />

      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white/90 px-8 py-10 text-center shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
        <p className="text-xs font-semibold tracking-[0.24em] text-slate-500">
          PAGE NOT FOUND
        </p>

        <div className="mt-5 flex items-center justify-center gap-4">
          <span className="text-7xl font-black leading-none text-slate-900 md:text-8xl">
            4
          </span>
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-slate-200 bg-slate-100 shadow-inner md:h-20 md:w-20">
            <img
              src="/logo/stem.png"
              alt="STEM Logo"
              className="h-10 w-10 object-contain md:h-12 md:w-12"
            />
          </div>
          <span className="text-7xl font-black leading-none text-slate-900 md:text-8xl">
            4
          </span>
        </div>

        <p className="mt-5 text-base font-medium text-slate-700">
          Halaman tidak ditemukan.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Periksa kembali URL yang Anda akses.
        </p>
      </div>
    </main>
  );
}
