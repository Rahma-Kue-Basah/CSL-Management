"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
};

export function AdminPageHeader({
  eyebrow = "CSL Admin",
  title,
  description,
  actions,
  icon,
}: AdminPageHeaderProps) {
  const showCornerIcon = !actions;

  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-500/40 bg-gradient-to-r from-[#0052C7] via-[#0048B4] to-[#003C99] px-5 py-4 text-white">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-50/90">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
          {description ? <p className="mt-3 text-sm text-blue-50/90">{description}</p> : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actions ? <div className="hidden sm:flex sm:items-center sm:gap-2">{actions}</div> : null}
          {showCornerIcon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
              {icon ?? <Sparkles className="h-5 w-5 text-white" />}
            </div>
          ) : null}
        </div>
      </div>

      {actions ? <div className="relative mt-3 flex flex-wrap items-center gap-2 sm:hidden">{actions}</div> : null}
    </div>
  );
}

export default AdminPageHeader;
