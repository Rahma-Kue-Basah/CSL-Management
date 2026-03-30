import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  OctagonX,
  Package,
  Sparkles,
} from "lucide-react";

import { hasMenuAccess } from "@/constants/roles";
import { useDashboardOverview } from "@/hooks/dashboard/use-dashboard-overview";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { useIsMobile } from "@/hooks/use-mobile";
import { canAccessAction, SIDEBAR_SHORTCUTS } from "@/lib/dashboard-navigation";
import { formatDateTimeWib } from "@/lib/date-format";
import { getStatusBadgeClass, getStatusSummaryTone } from "@/lib/status";

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: "slate" | "blue" | "amber" | "emerald" | "sky" | "rose";
}) {
  const toneClass =
    tone === "blue"
      ? {
          card: "border-blue-300 bg-blue-100/90",
          icon: "bg-white/80 text-blue-800",
          value: "text-blue-900",
        }
      : tone === "amber"
        ? {
            card: "border-amber-300 bg-amber-100/90",
            icon: "bg-white/80 text-amber-800",
            value: "text-amber-900",
          }
        : tone === "emerald"
          ? {
              card: "border-emerald-300 bg-emerald-100/90",
              icon: "bg-white/80 text-emerald-800",
              value: "text-emerald-900",
            }
          : tone === "sky"
            ? {
                card: "border-sky-300 bg-sky-100/90",
                icon: "bg-white/80 text-sky-800",
                value: "text-sky-900",
              }
            : tone === "rose"
              ? {
                  card: "border-rose-300 bg-rose-100/90",
                  icon: "bg-white/80 text-rose-800",
                  value: "text-rose-900",
                }
              : {
                  card: "border-slate-300 bg-slate-100/90",
                  icon: "bg-white/80 text-slate-800",
                  value: "text-slate-900",
                };

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_6px_18px_rgba(15,23,42,0.08)] ${toneClass.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className={`mt-3 text-3xl font-semibold leading-none ${toneClass.value}`}>
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-2.5 ${toneClass.icon}`}>{icon}</div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { profile } = useLoadProfile();
  const { overview, isLoading, error } = useDashboardOverview();
  const [shouldHideContent, setShouldHideContent] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    setShouldHideContent(isMobile);
    if (!isMobile) return;
    navigate("/dashboard/overview", { replace: true });
  }, [isMobile, navigate]);

  if (shouldHideContent) {
    return null;
  }

  const quickLinks = useMemo(() => {
    return SIDEBAR_SHORTCUTS.filter((item) =>
      hasMenuAccess(profile?.role, item.id as Parameters<typeof hasMenuAccess>[1]),
    )
      .flatMap((item) => {
        if (!item.actions.length) {
          return [
            {
              id: item.id,
              label: item.label,
              description: item.description,
              href: item.href,
            },
          ];
        }

        const firstAction = item.actions.find((action) => canAccessAction(profile?.role, action));
        if (!firstAction) return [];

        return [
          {
            id: `${item.id}:${firstAction.id}`,
            label: item.label,
            description: firstAction.description,
            href: firstAction.href,
          },
        ];
      })
      .filter((item) => item.href !== "/dashboard")
      .slice(0, 4);
  }, [profile?.role]);

  const recentActivities = overview.recent_activities.slice(0, 4);

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden px-6 py-7 lg:px-8 lg:py-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_35%)]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                <Sparkles className="h-3.5 w-3.5" />
                Ringkasan dashboard Anda
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">
                {profile?.name ? `Halo, ${profile.name}` : "Halo, selamat datang di CSL"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Pantau status pengajuan, buka layanan yang paling sering dipakai,
                dan lanjutkan proses tanpa harus berpindah-pindah menu.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {quickLinks.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="relative min-h-[220px] border-t border-slate-200 bg-slate-50 lg:border-l lg:border-t-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100/20 via-transparent to-sky-100/60" />
            <div className="relative h-full">
              <Image
                src="/images/welcome.jpg"
                alt="Welcome"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Pengajuan"
          value={overview.totals.total_requests}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="blue"
        />
        <SummaryCard
          label="Pending"
          value={overview.totals.pending}
          icon={<CalendarClock className="h-5 w-5" />}
          tone={getStatusSummaryTone("Pending")}
        />
        <SummaryCard
          label="Approved"
          value={overview.totals.approved}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone={getStatusSummaryTone("Approved")}
        />
        <SummaryCard
          label="Selesai + Ditolak"
          value={overview.totals.completed + overview.totals.rejected}
          icon={<Package className="h-5 w-5" />}
          tone="slate"
        />
      </div>

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat ringkasan dashboard...
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard
            title="Aktivitas Terbaru"
            description="Jejak pengajuan paling baru yang masih relevan untuk Anda."
          >
            {recentActivities.length ? (
              <div className="space-y-3">
                {recentActivities.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-slate-100/70"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-blue-700">
                          {item.code || "-"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{item.type}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatDateTimeWib(item.created_at)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${getStatusBadgeClass(item.status, { bordered: true })}`}
                    >
                      {item.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Belum ada aktivitas pengajuan terbaru.
              </div>
            )}
          </SectionCard>

          <div className="space-y-6">
            <SectionCard
              title="Akses Cepat"
              description="Masuk ke layanan yang paling sering dipakai tanpa buka menu satu per satu."
            >
              <div className="space-y-3">
                {quickLinks.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-[#0048B4]" />
                  </Link>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Sorotan Status"
              description="Gambaran singkat kondisi pengajuan yang perlu perhatian lebih dekat."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                    Menunggu Tindakan
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-amber-900">
                    {overview.totals.pending}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">
                    Rejected + Expired
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-rose-900">
                    {overview.totals.rejected + overview.totals.expired}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Butuh Tindak Lanjut
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Fokus utama saat ini ada pada pengajuan pending dan status akhir yang perlu ditinjau ulang.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </section>
  );
}
