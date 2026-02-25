import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { DashboardUserMenu } from "@/components/dashboard/dashboard-user-menu";

type UserLayoutProps = {
  children: ReactNode;
};

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-200 [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]">
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-slate-700 bg-[#0048B4] text-white">
        <div className="mx-auto flex w-full flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo/stem-name-white.png"
              alt="STEM Name"
              width={120}
              height={34}
              className="h-auto w-[100px] sm:w-[120px]"
              priority
            />
          </div>

          <div className="min-w-[220px] flex-1 md:mx-3">
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-lg border border-white/40 bg-transparent px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/75 focus:border-white/80"
            />
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg bg-transparent px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"
            >
              Home
            </Link>
            <Link
              href="/admin/home"
              className="rounded-lg bg-transparent px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"
            >
              Admin
            </Link>
            <Link
              href="/admin/my-profile"
              className="rounded-lg bg-transparent px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"
            >
              My Profile
            </Link>
          </nav>

          <div className="ml-auto">
            <DashboardUserMenu
              triggerClassName="h-10 rounded-lg bg-transparent px-2 text-white hover:bg-white/15"
              nameClassName="hidden text-white sm:block"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full space-y-6 pt-16">
        {children}
      </div>
    </main>
  );
}
