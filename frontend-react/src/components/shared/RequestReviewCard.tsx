"use client";

import type { ReactNode } from "react";
import { ClipboardCheck } from "lucide-react";

import { getStatusBadgeClass, getStatusDisplayLabel } from "@/lib/status";

type ReviewMetaItem = {
  label: string;
  value: string;
};

type RequestReviewCardProps = {
  status: string;
  code: string;
  meta?: ReviewMetaItem[];
  children?: ReactNode;
};

export function RequestReviewCard({
  status,
  code,
  meta = [],
  children,
}: RequestReviewCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
            <ClipboardCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Review Pengajuan</p>
            <p className="mt-1 text-xs font-medium tracking-wide text-slate-500">
              {code}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(status)}`}
        >
          {getStatusDisplayLabel(status)}
        </span>
      </div>

      {meta.length ? (
        <div className="mt-4 space-y-2">
          {meta.map((item) => (
            <div
              key={`${item.label}-${item.value}`}
              className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3"
            >
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-right text-xs leading-5 text-slate-800">{item.value || "-"}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 border-t border-slate-200 pt-4">
        {children ? (
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        ) : (
          <p className="text-sm text-slate-500">
            Tidak ada aksi review yang tersedia untuk pengajuan ini.
          </p>
        )}
      </div>
    </section>
  );
}
