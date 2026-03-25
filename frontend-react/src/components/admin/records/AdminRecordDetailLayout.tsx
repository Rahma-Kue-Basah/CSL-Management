import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Steps } from "rsuite";

import { Button } from "@/components/ui/button";
import { formatDateTimeWib } from "@/lib/date-time";
import { getStatusBadgeClass, getStatusDisplayLabel } from "@/lib/status";

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
  status,
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
        <div className={`border-b border-slate-200 sm:px-6 ${compact ? "px-4 py-3.5" : "px-5 py-5"}`}>
          <div className={`flex flex-col lg:flex-row lg:items-start lg:justify-between ${compact ? "gap-2.5" : "gap-4"}`}>
            <div className={`flex items-start ${compact ? "gap-2.5" : "gap-4"}`}>
              <div className={`flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 ${compact ? "h-9 w-9" : "h-10 w-10"}`}>
                {icon}
              </div>
              <div className={`min-w-0 ${compact ? "space-y-1" : "space-y-2"}`}>
                <div className="space-y-1">
                  <h1 className={`${compact ? "text-lg" : "text-xl"} font-semibold tracking-tight text-slate-900`}>
                    {title}
                  </h1>
                  <p className={`${compact ? "text-xs" : "text-sm"} text-slate-500`}>{code}</p>
                </div>
                {status ? (
                  <span
                    className={`inline-flex w-fit rounded-full ${compact ? "px-2.5 py-0.5" : "px-3 py-1"} text-xs font-semibold ${getStatusBadgeClass(status)}`}
                  >
                    {getStatusDisplayLabel(status)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {actions}
              <Button type="button" variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            </div>
          </div>
        </div>

        <div
          className={`grid sm:px-6 ${aside ? "xl:grid-cols-[minmax(0,1fr)_280px]" : ""} ${compact ? "gap-2.5 px-4 py-3.5" : "gap-4 px-5 py-5"}`}
        >
          <div className={compact ? "space-y-2.5" : "space-y-5"}>{children}</div>
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
    <section className={`rounded-xl border border-slate-200 bg-white ${compact ? "p-3.5" : "p-5"}`}>
      <div className={`flex items-center ${compact ? "mb-2.5 gap-2" : "mb-4 gap-3"}`}>
        <div className={`flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 ${compact ? "h-8 w-8" : "h-9 w-9"}`}>
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
  return <div className={`grid md:grid-cols-2 ${compact ? "gap-2" : "gap-3"}`}>{children}</div>;
}

export function AdminRecordDetailItem({
  label,
  value,
  hrefLabel,
  onClick,
  status,
  compact = false,
  borderless = false,
}: {
  label: string;
  value: string;
  hrefLabel?: string;
  onClick?: () => void;
  status?: boolean;
  compact?: boolean;
  borderless?: boolean;
}) {
  const displayValue = value?.trim() ? value : "-";

  return (
    <div
      className={
        borderless
          ? `${compact ? "space-y-0.5 px-0 py-1.5" : "space-y-1 px-0 py-2"}`
          : `rounded-md border border-slate-200 bg-slate-50 ${compact ? "space-y-0.5 px-3 py-2" : "space-y-1 px-4 py-3"}`
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {status ? (
        <span
          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(displayValue)}`}
        >
          {getStatusDisplayLabel(displayValue)}
        </span>
      ) : onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="text-left text-sm font-medium leading-relaxed text-sky-700 transition hover:text-sky-800"
        >
          {displayValue}
          {hrefLabel ? (
            <span className="ml-2 text-xs font-medium text-sky-500">
              {hrefLabel}
            </span>
          ) : null}
        </button>
      ) : (
        <p className="text-sm leading-relaxed text-slate-800">{displayValue}</p>
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
    <section className={`rounded-xl border border-slate-200 bg-slate-50 ${compact ? "p-3.5" : "p-5"}`}>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className={compact ? "mt-2.5 space-y-2" : "mt-4 space-y-3"}>{children}</div>
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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm leading-relaxed text-slate-800">{value || "-"}</p>
    </div>
  );
}

export function AdminRecordFlow({
  steps,
}: {
  steps: AdminRecordFlowStep[];
}) {
  const currentIndex = Math.max(
    0,
    steps.findIndex(
      (step) => step.state === "process" || step.state === "error",
    ),
  );

  return (
    <div className="admin-record-flow overflow-x-auto pb-1">
      <Steps current={currentIndex} className="min-w-[720px]">
        {steps.map((step) => (
          <Steps.Item
            key={step.key}
            title={step.label}
            status={step.state}
            description={step.time || " "}
          />
        ))}
      </Steps>
    </div>
  );
}

export function buildRequestFlow(item: {
  status: string;
  createdAt: string;
  updatedAt: string;
}): AdminRecordFlowStep[] {
  const status = String(item.status ?? "").trim().toLowerCase();

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
