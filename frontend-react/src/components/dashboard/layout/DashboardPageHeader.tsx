"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type DashboardPageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
};

export function DashboardPageHeader({
  title,
  description,
  eyebrow = "CSL User",
  icon,
}: DashboardPageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-500/35 bg-gradient-to-r from-[#0052C7] via-[#0048B4] to-[#003C99] px-5 py-4 text-white">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-50/90">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
          {description ? <p className="mt-2 text-sm text-blue-50/90">{description}</p> : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
          {icon ?? <Sparkles className="h-5 w-5 text-white" />}
        </div>
      </div>
    </div>
  );
}

export default DashboardPageHeader;
