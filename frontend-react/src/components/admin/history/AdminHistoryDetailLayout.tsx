import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { AdminDetailHeader } from "@/components/admin/shared";
import { ProgressSteps } from "@/components/shared";
import { formatDateTimeWib } from "@/lib/date";
import { getStatusBadgeClass, getStatusDisplayLabel } from "@/lib/request";

type AdminRecordFlowStep = {
  key: string;
  label: string;
  time?: string;
  state: "finish" | "process" | "wait" | "error";
};

export function AdminRecordDetailShell({
  title,
  code,
  icon,
  status: _status,
  backLabel = "Kembali",
  onBack,
  actions,
  children,
  aside,
  compact = false,
}: {
  title: string;
  code: string;
  icon: ReactNode;
  status?: string;
  backLabel?: string;
  onBack: () => void;
  actions?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`w-full ${compact ? "space-y-3" : "space-y-5"}`}>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <AdminDetailHeader
          title={title}
          meta={code}
          icon={icon}
          backLabel={backLabel}
          onBack={onBack}
          actions={actions}
          compact={compact}
        />

        <div
          className={`grid sm:px-6 ${aside ? "xl:grid-cols-[minmax(0,1fr)_280px]" : ""} ${compact ? "gap-2.5 px-4 py-3.5" : "gap-4 px-5 py-5"}`}
        >
          <div className={compact ? "space-y-2.5" : "space-y-5"}>
            {children}
          </div>
          {aside ? (
            <div className={compact ? "space-y-2.5" : "space-y-5"}>{aside}</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function AdminRecordDetailSection({
  title,
  description,
  icon,
  children,
  compact = false,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <section>
      <div
        className={`flex items-center ${compact ? "mb-2.5 gap-2" : "mb-4 gap-3"}`}
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 ${compact ? "h-8 w-8" : "h-9 w-9"}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="leading-none text-sm font-semibold text-slate-900">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function AdminRecordDetailGrid({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`grid md:grid-cols-2 ${compact ? "gap-2.5" : "gap-4"}`}>
      {children}
    </div>
  );
}

export function AdminRecordDetailItem({
  label,
  value,
  hrefLabel,
  hrefIcon = false,
  onClick,
  status,
  compact = false,
  borderless = false,
}: {
  label: string;
  value: string;
  hrefLabel?: string;
  hrefIcon?: boolean;
  onClick?: () => void;
  status?: boolean;
  compact?: boolean;
  borderless?: boolean;
}) {
  const displayValue = value?.trim() ? value : "-";

  return (
    <div className={borderless ? "space-y-1" : compact ? "space-y-1" : "space-y-1.5"}>
      <p className="text-xs font-medium text-slate-700">{label}</p>
      {status ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <span
            className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(displayValue)}`}
          >
            {getStatusDisplayLabel(displayValue)}
          </span>
        </div>
      ) : onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-sky-700 transition hover:text-sky-800"
        >
          {displayValue}
          {hrefIcon ? (
            <ArrowUpRight className="ml-2 inline h-3.5 w-3.5 align-text-top text-sky-500" />
          ) : hrefLabel ? (
            <span className="ml-2 text-xs font-medium text-sky-500">
              {hrefLabel}
            </span>
          ) : null}
        </button>
      ) : (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
          {displayValue}
        </div>
      )}
    </div>
  );
}

export function AdminRecordAsideCard({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className={compact ? "mt-2.5 space-y-2" : "mt-4 space-y-3"}>
        {children}
      </div>
    </section>
  );
}

export function AdminRecordAsideItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-700">{label}</p>
      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
        {value || "-"}
      </div>
    </div>
  );
}

export function AdminRecordFlow({ steps }: { steps: AdminRecordFlowStep[] }) {
  return (
    <div className="admin-record-flow">
      <ProgressSteps steps={steps} minWidthClassName="min-w-[720px]" />
    </div>
  );
}

export function buildRequestFlow(item: {
  status: string;
  createdAt: string;
  updatedAt: string;
}): AdminRecordFlowStep[] {
  const status = String(item.status ?? "")
    .trim()
    .toLowerCase();

  const baseSteps: AdminRecordFlowStep[] = [
    {
      key: "submitted",
      label: "Diajukan",
      time: formatDateTimeWib(item.createdAt),
      state: "finish",
    },
    {
      key: "review",
      label: "Diproses",
      state: "wait",
    },
    {
      key: "approved",
      label: "Disetujui",
      state: "wait",
    },
    {
      key: "completed",
      label: "Selesai",
      state: "wait",
    },
  ];

  if (status === "pending") {
    baseSteps[1].state = "process";
    return baseSteps;
  }
  if (status === "approved") {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "process";
    baseSteps[2].time = formatDateTimeWib(item.updatedAt);
    return baseSteps;
  }
  if (status === "completed") {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "finish";
    baseSteps[2].time = formatDateTimeWib(item.updatedAt);
    baseSteps[3].state = "process";
    baseSteps[3].time = formatDateTimeWib(item.updatedAt);
    return baseSteps;
  }
  if (status === "rejected") {
    baseSteps[1].state = "error";
    baseSteps[1].label = "Ditolak";
    baseSteps[1].time = formatDateTimeWib(item.updatedAt);
    return baseSteps.slice(0, 2);
  }
  if (status === "expired") {
    baseSteps[1].state = "error";
    baseSteps[1].label = "Kedaluwarsa";
    baseSteps[1].time = formatDateTimeWib(item.updatedAt);
    return baseSteps.slice(0, 2);
  }

  baseSteps[1].state = "process";
  return baseSteps;
}
