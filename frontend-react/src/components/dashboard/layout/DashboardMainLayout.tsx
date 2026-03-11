"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { DashboardPageHeader } from "@/components/dashboard/layout/DashboardPageHeader";
import { SidebarInset } from "@/components/ui/sidebar";

type DashboardMainLayoutProps = {
  pageTitle: string;
  pageDescription?: string | null;
  pageEyebrow?: string;
  pageIcon?: ReactNode;
  children: ReactNode;
};

export function DashboardMainLayout({
  pageTitle,
  pageDescription,
  pageEyebrow,
  pageIcon,
  children,
}: DashboardMainLayoutProps) {
  return (
    <SidebarInset className="min-w-0 flex-1 rounded-none bg-slate-100 shadow-none md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        <div className="flex-1 p-3 md:p-4">
          <div className="min-h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <DashboardPageHeader
              title={pageTitle}
              description={pageDescription ?? undefined}
              eyebrow={pageEyebrow}
              icon={pageIcon}
            />
            <div className="mt-4">{children}</div>
          </div>
        </div>
        <footer className="border-t border-slate-200/80 bg-white/80 px-4 py-4 text-center text-xs text-slate-500 backdrop-blur">
          2026 ©
          <Link href="/" className="ml-1 font-medium text-slate-600 hover:text-[#0048B4]">
            CSL STEM Universitas Prasetiya Mulya
          </Link>
        </footer>
      </div>
    </SidebarInset>
  );
}
