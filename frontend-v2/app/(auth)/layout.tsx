import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative grid h-svh overflow-hidden lg:grid-cols-[2fr_3fr] font-sans">
      <div className="relative hidden overflow-hidden lg:block lg:h-svh">
        <div className="absolute inset-0 bg-[url('/images/stem-building-2.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-red-500/80" />
        <div className="absolute left-12 top-16 max-w-xs text-white">
          <p className="text-sm uppercase tracking-[0.35em] text-white/70">
            CSL Management
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight">
            Satu akun untuk akses laboratorium, riset, dan komunitas.
          </h2>
          <p className="mt-4 text-sm text-white/70">
            Aman, cepat, dan terintegrasi dengan layanan kampus.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-6 p-6 md:p-10 lg:overflow-y-auto">
        <Link href="/">
          <Image
            src="/logo/stem-name-2.png"
            alt="CSL USE Logo"
            width={220}
            height={24}
          />
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-6 backdrop-blur">
            {children}
          </div>
        </div>
        <footer className="text-center text-sm text-muted-foreground">
          2026 ©
          <Link href="/" className="ml-1">
            CSL STEM Prasetiya Mulya
          </Link>
        </footer>
      </div>
    </div>
  );
}
