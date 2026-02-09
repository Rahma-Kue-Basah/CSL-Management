"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CalendarCheck2,
  Clock3,
  Loader2,
  Package,
  ShieldUser,
  Sparkles,
  Users,
  Waypoints,
  Handshake,
  User,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { API_AUTH_ADMIN_DASHBOARD_KPIS } from "@/constants/api";
import { useAdminActions, type AdminAction } from "@/hooks/admin/use-admin-actions";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { authFetch } from "@/lib/auth";

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
  if (action === "create") return "border-emerald-200 bg-emerald-100 text-emerald-800";
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

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(date);
}

function ActionList({ title, actions }: { title: string; actions: AdminAction[] }) {
  return (
    <div className="rounded-xl mb-16 border bg-linear-to-b from-white to-slate-50 p-3">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {actions.length ? (
        <div className="space-y-2">
          {actions.map((item, index) => (
            <div key={item.id} className="relative overflow-hidden rounded-lg border bg-white p-3">
              <span className={`absolute inset-y-0 left-0 w-1 ${getActionAccentClass(item.action)}`} />
              <div className="ml-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.object_repr || "-"}</p>
                  <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getActionBadgeClass(item.action)}`}>
                    {formatActionLabel(item.action)}
                  </span>
                </div>

                <div className="mt-2 grid gap-1 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <ShieldUser className="h-3.5 w-3.5 text-slate-500" />
                    <span className="truncate">{item.actor || "-"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Waypoints className="h-3.5 w-3.5 text-slate-500" />
                    <span className="truncate">{item.target || "-"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                    <span>{formatTime(item.action_time)}</span>
                  </p>
                </div>

                {item.change_message ? (
                  <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                    {item.change_message}
                  </p>
                ) : null}
              </div>
              {index < actions.length - 1 ? <div className="mt-3 border-b border-dashed border-slate-200" /> : null}
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
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setKpisError(loadError instanceof Error ? loadError.message : "Terjadi kesalahan.");
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

  const lastLoginText = profile.last_login ? formatTime(profile.last_login) : "-";
  const displayName = profile.name || "User";

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <section className="space-y-4 px-4">
      <AdminPageHeader
        title={`Selamat datang, ${displayName}!`}
        description={`Last login: ${lastLoginText}`}
        icon={<User className="h-5 w-5 text-sky-200" />}
      />

      {kpisError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {kpisError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Pengguna" value={isLoadingKpis ? "-" : String(kpis.totalUsers)} tone="users" />
        <KpiCard label="Ruangan" value={isLoadingKpis ? "-" : String(kpis.totalRooms)} tone="rooms" />
        <KpiCard label="Peralatan" value={isLoadingKpis ? "-" : String(kpis.totalEquipments)} tone="equipments" />
        <KpiCard label="Booking Request" value={isLoadingKpis ? "-" : String(kpis.totalBookings)} tone="bookings" />
        <KpiCard label="Borrow Request" value={isLoadingKpis ? "-" : String(kpis.totalBorrows)} tone="borrows" />
        <KpiCard label="Use Request" value={isLoadingKpis ? "-" : String(kpis.totalUseRequest)} tone="useRequest" />
        <KpiCard label="Pengujian Request" value={isLoadingKpis ? "-" : String(kpis.totalPengujian)} tone="pengujian" />
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionList title="My Actions" actions={myActions} />
        <ActionList title="Recent Actions" actions={recentActions} />
      </div>
    </section>
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
  if (tone === "users") return "border-sky-200 from-sky-50 to-sky-100/40";
  if (tone === "rooms") return "border-emerald-200 from-emerald-50 to-emerald-100/40";
  if (tone === "equipments") return "border-violet-200 from-violet-50 to-violet-100/40";
  if (tone === "bookings") return "border-amber-200 from-amber-50 to-amber-100/40";
  if (tone === "borrows") return "border-rose-200 from-rose-50 to-rose-100/40";
  if (tone === "pengujian") return "border-cyan-200 from-cyan-50 to-cyan-100/40";
  return "border-indigo-200 from-indigo-50 to-indigo-100/40";
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

function KpiCard({ label, value, tone }: { label: string; value: string; tone: KpiTone }) {
  const Icon = getKpiIcon(tone);
  return (
    <div className={`relative overflow-hidden rounded-lg border bg-gradient-to-br p-4 ${getKpiToneClass(tone)}`}>
      <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/40 blur-lg" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
        <span className={`inline-flex rounded-lg p-1.5 ${getKpiIconToneClass(tone)}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={`relative mt-3 text-3xl font-bold leading-none ${getKpiValueToneClass(tone)}`}>{value}</p>
    </div>
  );
}
