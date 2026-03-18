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
}) {
  return (
    <div className="w-full space-y-5">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                {icon}
              </div>
              <div className="min-w-0 space-y-2">
                <div className="space-y-1">
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                    {title}
                  </h1>
                  <p className="text-sm text-slate-500">{code}</p>
                </div>
                {status ? (
                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(status)}`}
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

        <div className="grid gap-4 px-5 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">{children}</div>
          <div className="space-y-5">{aside}</div>
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
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
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
}: {
  children: ReactNode;
}) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}

export function AdminRecordDetailItem({
  label,
  value,
  hrefLabel,
  onClick,
  status,
}: {
  label: string;
  value: string;
  hrefLabel?: string;
  onClick?: () => void;
  status?: boolean;
}) {
  const displayValue = value?.trim() ? value : "-";

  return (
    <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
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
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
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
