"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarCheck2,
  Clock3,
  Package,
  ShieldUser,
  Sparkles,
  Users,
  Waypoints,
  Handshake,
  User,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import InlineErrorAlert from "@/components/shared/inline-error-alert";
import { Skeleton } from "@/components/ui/skeleton";
import { API_AUTH_ADMIN_DASHBOARD_KPIS } from "@/constants/api";
import {
  useAdminActions,
  type AdminAction,
} from "@/hooks/admin/use-admin-actions";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { authFetch } from "@/lib/auth";
import {
  formatDateId,
  formatDateTimeIdWithZone,
  formatTimeIdWithZone,
} from "@/lib/date-format";

type AdminKpis = {
  totalUsers: number;
  totalRooms: number;
  totalEquipments: number;
  totalBookings: number;
  totalBorrows: number;
  totalPengujian: number;
  totalUseRequest: number;
};

type AdminKpisResponse = {
  total_users?: number;
  total_rooms?: number;
  total_equipments?: number;
  total_bookings?: number;
  total_borrows?: number;
};

function formatActionLabel(action: AdminAction["action"]) {
  if (action === "create") return "Create";
  if (action === "update") return "Update";
  if (action === "delete") return "Delete";
  return "Unknown";
}

function getActionBadgeClass(action: AdminAction["action"]) {
  if (action === "create")
    return "border-emerald-200 bg-emerald-100 text-emerald-800";
  if (action === "update") return "border-sky-200 bg-sky-100 text-sky-800";
  if (action === "delete") return "border-rose-200 bg-rose-100 text-rose-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getActionAccentClass(action: AdminAction["action"]) {
  if (action === "create") return "bg-emerald-500";
  if (action === "update") return "bg-sky-500";
  if (action === "delete") return "bg-rose-500";
  return "bg-slate-400";
}

function ActionList({
  title,
  actions,
}: {
  title: string;
  actions: AdminAction[];
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-linear-to-b from-white to-slate-50 p-3">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {actions.length ? (
        <div className="space-y-2">
          {actions.map((item, index) => (
            <div
              key={item.id}
              className="relative min-w-0 overflow-hidden rounded-lg border bg-white p-3"
            >
              <span
                className={`absolute inset-y-0 left-0 w-1 ${getActionAccentClass(item.action)}`}
              />
              <div className="ml-2 min-w-0">
                <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <p className="min-w-0 max-w-[80%] flex-1 break-all text-sm font-semibold text-slate-900 sm:max-w-none sm:break-words sm:line-clamp-2">
                    {item.object_repr || "-"}
                  </p>
                  <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getActionBadgeClass(item.action)}`}
                    >
                      {formatActionLabel(item.action)}
                    </span>
                    {/* <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      <CalendarCheck2 className="h-3 w-3 text-slate-500" />
                      {formatDateId(item.action_time)}
                      <Clock3 className="h-3 w-3 text-slate-500" />
                      {formatTimeIdWithZone(item.action_time)}
                    </span> */}
                  </div>
                </div>

                <div className="mt-2 grid gap-1 text-xs text-slate-600">
                  <p className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <span className="flex min-w-0 max-w-[80%] flex-1 items-center gap-1 sm:max-w-none">
                      <ShieldUser className="h-3.5 w-3.5 text-slate-500" />
                      <span className="min-w-0 flex-1 break-all sm:break-words">
                        {item.actor || "-"}
                      </span>
                    </span>
                    <span className="flex max-w-full flex-wrap items-center gap-1 break-words text-[11px] sm:text-xs">
                      <CalendarCheck2 className="h-3 w-3 text-slate-500" />
                      {formatDateId(item.action_time)} {", "}
                      {formatTimeIdWithZone(item.action_time)}
                    </span>
                  </p>
                  {/* <p className="flex min-w-0 items-center gap-2">
                    <Waypoints className="h-3.5 w-3.5 text-slate-500" />
                    <span className="min-w-0 max-w-[80%] flex-1 break-all sm:max-w-none sm:break-words">
                      {item.target || "-"}
                    </span>
                  </p> */}
                </div>

                {item.change_message ? (
                  <p className="mt-2 min-w-0 break-all rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                    {item.change_message}
                  </p>
                ) : null}
              </div>
              {index < actions.length - 1 ? (
                <div className="mt-3 border-b border-dashed border-slate-200" />
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
      )}
    </div>
  );
}

export default function Page() {
  const { recentActions, myActions, isLoading, error } = useAdminActions();
  const { profile } = useLoadProfile();
  const [kpis, setKpis] = useState<AdminKpis>({
    totalUsers: 0,
    totalRooms: 0,
    totalEquipments: 0,
    totalBookings: 0,
    totalBorrows: 0,
    totalPengujian: 0,
    totalUseRequest: 0,
  });
  const [isLoadingKpis, setIsLoadingKpis] = useState(true);
  const [kpisError, setKpisError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isAborted = false;

    const loadKpis = async () => {
      setIsLoadingKpis(true);
      setKpisError("");

      try {
        const response = await authFetch(API_AUTH_ADMIN_DASHBOARD_KPIS, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Gagal memuat KPI (${response.status})`);
        }

        const payload = (await response.json()) as AdminKpisResponse;
        setKpis({
          totalUsers: payload.total_users ?? 0,
          totalRooms: payload.total_rooms ?? 0,
          totalEquipments: payload.total_equipments ?? 0,
          totalBookings: payload.total_bookings ?? 0,
          totalBorrows: payload.total_borrows ?? 0,
          totalPengujian: 0,
          totalUseRequest: 0,
        });
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        )
          return;
        setKpisError(
          loadError instanceof Error ? loadError.message : "Terjadi kesalahan.",
        );
      } finally {
        if (isAborted || controller.signal.aborted) return;
        setIsLoadingKpis(false);
      }
    };

    void loadKpis();

    return () => {
      isAborted = true;
      controller.abort();
    };
  }, []);

  const lastLoginText = profile.last_login
    ? formatDateTimeIdWithZone(profile.last_login)
    : "-";
  const displayName = profile.name || "User";

  if (isLoading) {
    return <HomePageSkeleton />;
  }

  return (
    <section className="space-y-4 px-4">
      <AdminPageHeader
        title={`Selamat datang, ${displayName}!`}
        description={`Last login: ${lastLoginText}`}
        icon={
          <Link
            href="/admin/my-profile"
            aria-label="Buka profil saya"
            className="inline-flex h-full w-full items-center justify-center rounded-full"
          >
            <User className="h-5 w-5 text-sky-200" />
          </Link>
        }
      />

      {kpisError ? (
        <InlineErrorAlert>{kpisError}</InlineErrorAlert>
      ) : null}

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard
          label="Pengguna"
          value={isLoadingKpis ? "0" : String(kpis.totalUsers)}
          tone="users"
        />
        <KpiCard
          label="Ruangan"
          value={isLoadingKpis ? "0" : String(kpis.totalRooms)}
          tone="rooms"
        />
        <KpiCard
          label="Peralatan"
          value={isLoadingKpis ? "0" : String(kpis.totalEquipments)}
          tone="equipments"
        />
        <KpiCard
          label="Booking Request"
          value={isLoadingKpis ? "0" : String(kpis.totalBookings)}
          tone="bookings"
        />
        <KpiCard
          label="Borrow Request"
          value={isLoadingKpis ? "0" : String(kpis.totalBorrows)}
          tone="borrows"
        />
        <KpiCard
          label="Use Request"
          value={isLoadingKpis ? "0" : String(kpis.totalUseRequest)}
          tone="useRequest"
        />
        <KpiCard
          label="Pengujian Request"
          value={isLoadingKpis ? "0" : String(kpis.totalPengujian)}
          tone="pengujian"
        />
      </div>

      {error ? (
        <InlineErrorAlert>{error}</InlineErrorAlert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionList title="My Actions" actions={myActions} />
        <ActionList title="Recent Actions" actions={recentActions} />
      </div>
    </section>
  );
}

function HomePageSkeleton() {
  return (
    <section className="space-y-4 px-4">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0052C7] via-[#0048B4] to-[#003C99] px-5 py-4">
        <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-3 w-20 bg-white/20" />
            <Skeleton className="h-8 w-56 bg-white/20" />
            <Skeleton className="mt-3 h-4 w-44 bg-white/20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={`kpi-skeleton-${index}`}
            className="relative overflow-hidden rounded-lg border bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-8 w-14" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionListSkeleton />
        <ActionListSkeleton />
      </div>
    </section>
  );
}

function ActionListSkeleton() {
  return (
    <div className="mb-16 rounded-xl border bg-linear-to-b from-white to-slate-50 p-3">
      <Skeleton className="mb-3 h-5 w-28" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`action-skeleton-${index}`}
            className="overflow-hidden rounded-lg border bg-white p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="mt-2 space-y-2">
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type KpiTone =
  | "users"
  | "rooms"
  | "equipments"
  | "bookings"
  | "borrows"
  | "pengujian"
  | "useRequest";

function getKpiToneClass(tone: KpiTone) {
  if (tone === "users") return "border-sky-300 from-sky-100 to-sky-200/80";
  if (tone === "rooms")
    return "border-emerald-300 from-emerald-100 to-emerald-200/80";
  if (tone === "equipments")
    return "border-violet-300 from-violet-100 to-violet-200/80";
  if (tone === "bookings")
    return "border-amber-300 from-amber-100 to-amber-200/80";
  if (tone === "borrows") return "border-rose-300 from-rose-100 to-rose-200/80";
  if (tone === "pengujian")
    return "border-cyan-300 from-cyan-100 to-cyan-200/80";
  return "border-indigo-300 from-indigo-100 to-indigo-200/80";
}

function getKpiValueToneClass(tone: KpiTone) {
  if (tone === "users") return "text-sky-800";
  if (tone === "rooms") return "text-emerald-800";
  if (tone === "equipments") return "text-violet-800";
  if (tone === "bookings") return "text-amber-800";
  if (tone === "borrows") return "text-rose-800";
  if (tone === "pengujian") return "text-cyan-800";
  return "text-indigo-800";
}

function getKpiIcon(tone: KpiTone) {
  if (tone === "users") return Users;
  if (tone === "rooms") return Building2;
  if (tone === "equipments") return Package;
  if (tone === "bookings") return CalendarCheck2;
  if (tone === "borrows") return Handshake;
  if (tone === "pengujian") return Sparkles;
  return Waypoints;
}

function getKpiIconToneClass(tone: KpiTone) {
  if (tone === "users") return "bg-sky-100 text-sky-700";
  if (tone === "rooms") return "bg-emerald-100 text-emerald-700";
  if (tone === "equipments") return "bg-violet-100 text-violet-700";
  if (tone === "bookings") return "bg-amber-100 text-amber-700";
  if (tone === "borrows") return "bg-rose-100 text-rose-700";
  if (tone === "pengujian") return "bg-cyan-100 text-cyan-700";
  return "bg-indigo-100 text-indigo-700";
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: KpiTone;
}) {
  const Icon = getKpiIcon(tone);
  const [animatedValue, setAnimatedValue] = useState(0);
  const target = Number(value);
  const isNumericValue = Number.isFinite(target);

  useEffect(() => {
    if (!isNumericValue) return;

    const safeTarget = Math.max(0, Math.floor(target));
    if (safeTarget === 0) {
      setAnimatedValue(0);
      return;
    }

    const duration = 800;
    const startTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setAnimatedValue(Math.round(safeTarget * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    setAnimatedValue(0);
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [isNumericValue, target]);

  const displayValue = isNumericValue
    ? new Intl.NumberFormat("id-ID").format(animatedValue)
    : value;

  return (
    <div
      className={`relative overflow-hidden rounded-lg border bg-linear-to-br p-4 ${getKpiToneClass(tone)}`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/40 blur-lg" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          {label}
        </p>
        <span
          className={`inline-flex rounded-lg p-1.5 ${getKpiIconToneClass(tone)}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p
        className={`relative mt-3 text-3xl font-bold leading-none ${getKpiValueToneClass(tone)}`}
      >
        {displayValue}
      </p>
    </div>
  );
}
