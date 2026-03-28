"use client";

import { useEffect, useState } from "react";
import { BellRing, Clock3 } from "lucide-react";
import Link from "next/link";

import InlineErrorAlert from "@/components/shared/inline-error-alert";
import { Skeleton } from "@/components/ui/skeleton";
import { API_NOTIFICATIONS } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { formatDateTimeIdWithZone } from "@/lib/date-format";

type NotificationItem = {
  id: string;
  title: string;
  category: string;
  message: string;
  target_path?: string | null;
  created_at: string;
};

type NotificationsResponse = {
  results?: NotificationItem[];
};

function NotificationBadge({ category }: { category: string }) {
  const normalized = String(category || "").toLowerCase();
  if (normalized === "approved") {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
        Approved
      </span>
    );
  }
  if (normalized === "rejected") {
    return (
      <span className="rounded-full border border-rose-200 bg-rose-100 px-2 py-1 text-xs font-medium text-rose-800">
        Rejected
      </span>
    );
  }
  return (
    <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
      Reminder
    </span>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isAborted = false;

    const loadNotifications = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await authFetch(API_NOTIFICATIONS, {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat notifikasi (${response.status})`);
        }

        const payload = (await response.json()) as
          | NotificationsResponse
          | NotificationItem[];
        const results = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.results)
            ? payload.results
            : [];
        setNotifications(results);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        )
          return;
        setError(
          loadError instanceof Error ? loadError.message : "Terjadi kesalahan.",
        );
      } finally {
        if (isAborted || controller.signal.aborted) return;
        setIsLoading(false);
      }
    };

    void loadNotifications();

    return () => {
      isAborted = true;
      controller.abort();
    };
  }, []);

  return (
    <section className="space-y-4">
      {error ? <InlineErrorAlert>{error}</InlineErrorAlert> : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`notification-skeleton-${index}`}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-3 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-5/6" />
            </div>
          ))}
        </div>
      ) : notifications.length ? (
        <div className="space-y-3">
          {notifications.map((item) => (
            item.target_path ? (
              <Link
                key={item.id}
                href={item.target_path}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#0048B4]/30 hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600">{item.message}</p>
                  </div>
                  <NotificationBadge category={item.category} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span>{formatDateTimeIdWithZone(item.created_at)}</span>
                  </div>
                  <span className="font-medium text-[#0048B4]">
                    Lihat detail
                  </span>
                </div>
              </Link>
            ) : (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600">{item.message}</p>
                  </div>
                  <NotificationBadge category={item.category} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{formatDateTimeIdWithZone(item.created_at)}</span>
                </div>
              </article>
            )
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          Belum ada notifikasi untuk akun Anda.
        </div>
      )}
    </section>
  );
}
