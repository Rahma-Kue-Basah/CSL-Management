"use client";

import { useMemo } from "react";
import { CalendarDays, Megaphone, UserRound } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnnouncements,
  type Announcement,
} from "@/hooks/announcements/use-announcements";

function stripHtmlTags(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateLabel(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDate =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (isSameDate) return "Hari ini";

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return "Kemarin";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getDateKey(value?: string | null) {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toISOString().slice(0, 10);
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const content = useMemo(
    () => stripHtmlTags(announcement.content || ""),
    [announcement.content],
  );
  const author =
    announcement.created_by_detail?.full_name ||
    announcement.created_by_detail?.email ||
    "-";
  const createdAt = formatTime(announcement.created_at);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.1)]">
      <div className="absolute -right-16 -top-20 h-32 w-32 rounded-full bg-slate-100/70 blur-2xl transition group-hover:bg-slate-200/60" />
      <div className="absolute -left-20 -bottom-16 h-32 w-32 rounded-full bg-slate-50 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
              <CalendarDays className="h-3 w-3" />
              {createdAt}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
              <UserRound className="h-3 w-3" />
              {author}
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
            {announcement.title || "Pengumuman"}
          </h3>
        </div>
        {/* <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
          <Megaphone className="h-5 w-5" />
        </span> */}
      </div>
      <p className="relative mt-3 text-sm leading-relaxed text-slate-700 line-clamp-3">
        {content || "-"}
      </p>
    </article>
  );
}

export default function DashboardAnnouncementsPage() {
  const { announcements, isLoading, error } = useAnnouncements();
  const groupedAnnouncements = useMemo(() => {
    const sorted = [...announcements].sort((first, second) => {
      const firstTime = first.created_at
        ? new Date(first.created_at).getTime()
        : 0;
      const secondTime = second.created_at
        ? new Date(second.created_at).getTime()
        : 0;
      return secondTime - firstTime;
    });
    const map = new Map<string, Announcement[]>();
    sorted.forEach((item) => {
      const key = getDateKey(item.created_at);
      const group = map.get(key) ?? [];
      group.push(item);
      map.set(key, group);
    });
    return Array.from(map.entries());
  }, [announcements]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`announcement-skeleton-${index}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-5 w-72" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!announcements.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        Belum ada pengumuman.
      </div>
    );
  }

  return (
    <div className="relative z-0 space-y-6">
      <span className="pointer-events-none absolute left-[18px] top-9 bottom-0 z-0 w-px bg-slate-200" />
      {groupedAnnouncements.map(([dateKey, items]) => (
        <section key={dateKey} className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div className="text-sm font-semibold text-slate-800">
              {formatDateLabel(items[0]?.created_at)}
            </div>
          </div>
          <div className="space-y-4 pl-11">
            {items.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
