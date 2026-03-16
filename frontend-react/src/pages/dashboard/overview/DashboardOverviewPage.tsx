"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  OctagonX,
  Package,
} from "lucide-react";

import { useDashboardOverview } from "@/hooks/dashboard/use-dashboard-overview";
import { formatDateTimeWib } from "@/lib/date-time";
import { getStatusBadgeClass } from "@/lib/status";

type OverviewItem = {
  id: string;
  title: string;
  code: string;
  type: string;
  status: string;
  createdAt: string;
  href: string;
};

type UpcomingApprovedItem = {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime?: string;
  href: string;
};

function SummaryCard({
  label,
  value,
  icon,
  tone = "slate",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "slate" | "amber" | "emerald" | "sky" | "rose";
}) {
  const toneClass =
    tone === "amber"
      ? {
          card: "border-amber-200 bg-amber-50",
          icon: "bg-amber-100 text-amber-700",
          value: "text-amber-900",
        }
      : tone === "emerald"
        ? {
            card: "border-emerald-200 bg-emerald-50",
            icon: "bg-emerald-100 text-emerald-700",
            value: "text-emerald-900",
          }
        : tone === "sky"
          ? {
              card: "border-sky-200 bg-sky-50",
              icon: "bg-sky-100 text-sky-700",
              value: "text-sky-900",
            }
          : tone === "rose"
            ? {
                card: "border-rose-200 bg-rose-50",
                icon: "bg-rose-100 text-rose-700",
                value: "text-rose-900",
              }
            : {
                card: "border-slate-200 bg-white",
                icon: "bg-slate-100 text-slate-700",
                value: "text-slate-900",
              };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass.card}`}>
      <div className="flex min-h-28 items-stretch justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className={`mt-2 text-5xl font-semibold ${toneClass.value}`}>
            {value}
          </p>
        </div>
        <div className={`self-start rounded-xl p-2.5 ${toneClass.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function RecentActivityItem({ item }: { item: OverviewItem }) {
  return (
    <Link
      href={item.href}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-900">
            {item.title}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(item.status, { bordered: true })}`}
        >
          {item.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          {item.type}
        </span>
        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-blue-700">
          {item.code || "-"}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
        <span className="text-slate-500">{formatDateTimeWib(item.createdAt)}</span>
        <span className="inline-flex items-center gap-1 font-medium text-[#0048B4]">
          Lihat detail
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function UpcomingApprovedCard({ item }: { item: UpcomingApprovedItem }) {
  return (
    <Link
      href={item.href}
      className="upcoming-approved-water block rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100/60"
    >
      <div className="pointer-events-none absolute right-8 top-6 h-24 w-24">
        <span className="upcoming-approved-water-ripple absolute left-1/2 top-10 h-14 w-14 -translate-x-1/2 rounded-full border border-emerald-300/70 bg-emerald-200/20" />
        <span className="upcoming-approved-water-ripple absolute left-1/2 top-10 h-14 w-14 -translate-x-1/2 rounded-full border border-emerald-300/55 bg-emerald-200/10 [animation-delay:1.4s]" />
        <span className="upcoming-approved-water-drop absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rounded-full bg-emerald-400/70 shadow-[0_0_18px_rgba(52,211,153,0.35)]" />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Jadwal Terdekat Anda
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            {item.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{item.type}</p>
        </div>
        <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
          <BellRing className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-white/80 p-3">
          <p className="text-xs font-medium text-slate-500">Mulai</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatDateTimeWib(item.startTime)}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white/80 p-3">
          <p className="text-xs font-medium text-slate-500">Selesai</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {item.endTime ? formatDateTimeWib(item.endTime) : "-"}
          </p>
        </div>
      </div>

      <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#0048B4]">
        Lihat detail
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

export default function DashboardOverviewPage() {
  const { overview, isLoading, error } = useDashboardOverview();

  const upcomingApproved = useMemo<UpcomingApprovedItem | null>(() => {
    if (!overview.upcoming_approved) return null;

    return {
      id: overview.upcoming_approved.id,
      title: overview.upcoming_approved.title,
      type: overview.upcoming_approved.type,
      startTime: overview.upcoming_approved.start_time,
      endTime: overview.upcoming_approved.end_time ?? undefined,
      href: overview.upcoming_approved.href,
    };
  }, [overview.upcoming_approved]);

  const recentActivities = useMemo<OverviewItem[]>(
    () =>
      overview.recent_activities.map((item) => ({
        id: item.id,
        title: item.title,
        code: item.code,
        type: item.type,
        status: item.status,
        createdAt: item.created_at,
        href: item.href,
      })),
    [overview.recent_activities],
  );

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Total Pengajuan"
          value={overview.totals.total_requests}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="slate"
        />
        <SummaryCard
          label="Menunggu Proses"
          value={overview.totals.pending}
          icon={<CalendarClock className="h-5 w-5" />}
          tone="amber"
        />
        <SummaryCard
          label="Disetujui"
          value={overview.totals.approved}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
        />
        <SummaryCard
          label="Selesai"
          value={overview.totals.completed}
          icon={<Package className="h-5 w-5" />}
          tone="sky"
        />
        <SummaryCard
          label="Ditolak"
          value={overview.totals.rejected}
          icon={<OctagonX className="h-5 w-5" />}
          tone="rose"
        />
      </div>

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat ringkasan pengajuan...
          </div>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!isLoading && !error ? (
        <>
          {upcomingApproved ? <UpcomingApprovedCard item={upcomingApproved} /> : null}

          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Aktivitas Pengajuan Terbaru
              </h2>
            </div>
          </div>

          {recentActivities.length ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {recentActivities.map((item) => (
                <RecentActivityItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600">
                Belum ada aktivitas pengajuan untuk akun ini.
              </p>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
