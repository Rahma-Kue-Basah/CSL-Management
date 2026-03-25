"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { getStatusSummaryTone, type StatusSummaryTone } from "@/lib/status";

type SummaryCardItem = {
  label: string;
  value: number | string;
  icon?: ReactNode;
  tone?: StatusSummaryTone;
};

type AdminRecordSummaryCardsProps = {
  items: SummaryCardItem[];
};

function getToneClass(tone: StatusSummaryTone) {
  if (tone === "amber") return "border-amber-300 bg-amber-100 text-amber-900";
  if (tone === "emerald") return "border-emerald-300 bg-emerald-100 text-emerald-900";
  if (tone === "sky") return "border-sky-300 bg-sky-100 text-sky-900";
  if (tone === "rose") return "border-rose-300 bg-rose-100 text-rose-900";
  if (tone === "slate") return "border-slate-300 bg-slate-200 text-slate-900";
  return "border-blue-300 bg-blue-100 text-blue-900";
}

function SummaryCard({ label, value, icon, tone = "blue" }: SummaryCardItem) {
  return (
    <article
      className={cn(
        "rounded-2xl border px-4 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.06)]",
        getToneClass(tone),
      )}
    >
      <div className="flex min-h-18 items-stretch justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
            {label}
          </p>
          <p className="mt-auto text-left text-2xl font-bold leading-none">{value}</p>
        </div>
        {icon ? (
          <div className="self-start rounded-xl border border-current/15 bg-white/70 p-2">
            {icon}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function AdminRecordSummaryCards({
  items,
}: AdminRecordSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
      {items.map((item) => (
        <SummaryCard
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
          tone={item.tone ?? getStatusSummaryTone(item.label)}
        />
      ))}
    </div>
  );
}
