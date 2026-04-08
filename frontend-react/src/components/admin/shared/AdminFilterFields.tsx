"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/core";

const ADMIN_FILTER_LABEL_CLASS = "mb-0.5 block text-[11px] font-semibold text-slate-900/90";
const ADMIN_FILTER_INPUT_CLASS =
  "h-8 border-slate-400 bg-white px-2 py-0 text-xs placeholder:text-xs shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100";
const ADMIN_FILTER_SELECT_CLASS =
  "h-8 w-full rounded-md border border-slate-400 bg-white px-2 text-xs outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100";

type AdminFilterGridProps = {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
};

const GRID_CLASS_BY_COLUMNS = {
  2: "grid grid-cols-1 gap-2 md:grid-cols-2",
  3: "grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3",
  4: "grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4",
  5: "grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5",
  6: "grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6",
} as const;

export function AdminFilterGrid({
  children,
  columns = 6,
  className,
}: AdminFilterGridProps) {
  return <div className={cn(GRID_CLASS_BY_COLUMNS[columns], className)}>{children}</div>;
}

type AdminFilterFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function AdminFilterField({
  label,
  children,
  className,
}: AdminFilterFieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <label className={ADMIN_FILTER_LABEL_CLASS}>{label}</label>
      {children}
    </div>
  );
}

export {
  ADMIN_FILTER_INPUT_CLASS,
  ADMIN_FILTER_LABEL_CLASS,
  ADMIN_FILTER_SELECT_CLASS,
};
