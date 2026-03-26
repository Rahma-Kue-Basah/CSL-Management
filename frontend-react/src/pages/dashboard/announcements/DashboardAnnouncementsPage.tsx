"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnnouncements,
  type Announcement,
} from "@/hooks/announcements/use-announcements";
import { formatDateTimeWib } from "@/lib/date-format";
import { stripHtmlTags } from "@/lib/text";

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const content = useMemo(
    () => stripHtmlTags(announcement.content || ""),
    [announcement.content],
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateTimeWib(announcement.created_at)}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-900">
            {announcement.title || "Pengumuman"}
          </h3>
        </div>

      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        {content || "-"}
      </p>
    </article>
  );
}

function AnnouncementSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

export default function DashboardAnnouncementsPage() {
  const { announcements, isLoading, error } = useAnnouncements();
  const [search, setSearch] = useState("");

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...announcements].sort((first, second) => {
      const firstTime = first.created_at
        ? new Date(first.created_at).getTime()
        : 0;
      const secondTime = second.created_at
        ? new Date(second.created_at).getTime()
        : 0;
      return secondTime - firstTime;
    });

    if (!query) return sorted;

    return sorted.filter((item) =>
      [item.title, stripHtmlTags(item.content || "")]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [announcements, search]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <AnnouncementSkeleton key={`announcement-skeleton-${index}`} />
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

  return (
    <section className="space-y-5">
      <div className="space-y-3">
        {filteredAnnouncements.length ? (
          filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
            />
          ))
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Tidak ada pengumuman yang cocok dengan pencarian Anda.
          </div>
        )}
      </div>
    </section>
  );
}
