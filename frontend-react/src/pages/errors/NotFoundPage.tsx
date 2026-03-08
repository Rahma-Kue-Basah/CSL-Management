import Link from "next/link";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-57px)] w-full max-w-6xl items-center px-4 py-10 md:px-6">
        <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="order-2 space-y-5 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#0048B4]">
              404 Not Found
            </p>
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                Halaman yang Anda cari tidak tersedia.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                URL yang diakses mungkin sudah berubah, salah ketik, atau memang
                tidak memiliki halaman tujuan.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="bg-[#0048B4] text-white hover:bg-[#003b93]"
                onClick={() => navigate(-1)}
              >
                Kembali
              </Button>
            </div>
          </div>

          <div className="hidden grid-cols-[auto_auto_auto] items-center justify-center gap-0.5 py-6 md:grid md:gap-1 lg:order-2">
            <span className="text-6xl font-black leading-none text-slate-900 md:text-[10rem]">
              4
            </span>
            <div className="grid place-items-center">
              <div className="grid h-24 w-24 place-items-center md:h-28 md:w-28">
                <img
                  src="/logo/stem.png"
                  alt="STEM Logo"
                  className="h-24 w-24 object-contain md:h-28 md:w-28"
                />
              </div>
            </div>
            <span className="text-6xl font-black leading-none text-slate-900 md:text-[10rem]">
              4
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
