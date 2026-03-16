"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Eye,
  Loader2,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { Button } from "@/components/ui/button";
import {
  useBookings,
  type BookingListScope,
} from "@/hooks/bookings/use-bookings";
import { useUpdateBookingStatus } from "@/hooks/bookings/use-update-booking-status";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";
import BookingStatusConfirmDialog from "@/pages/dashboard/booking-rooms/BookingStatusConfirmDialog";
import {
  toEndOfDay,
  toStartOfDay,
} from "@/lib/date";
import { formatDateTimeWib } from "@/lib/date-time";
import { getStatusBadgeClass } from "@/lib/status";

const PAGE_SIZE = 10;

function isPendingStatus(status: string) {
  return status.toLowerCase() === "pending";
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: "blue" | "amber" | "emerald" | "violet" | "rose";
}) {
  const toneClass =
    tone === "blue"
      ? {
          card: "border-blue-200/80 bg-blue-50/70",
          icon: "bg-blue-100 text-blue-700",
          value: "text-blue-900",
        }
      : tone === "amber"
        ? {
            card: "border-amber-200/80 bg-amber-50/70",
            icon: "bg-amber-100 text-amber-700",
            value: "text-amber-900",
          }
        : tone === "emerald"
          ? {
              card: "border-emerald-200/80 bg-emerald-50/70",
              icon: "bg-emerald-100 text-emerald-700",
              value: "text-emerald-900",
            }
          : tone === "violet"
            ? {
                card: "border-violet-200/80 bg-violet-50/70",
                icon: "bg-violet-100 text-violet-700",
                value: "text-violet-900",
              }
            : {
                card: "border-rose-200/80 bg-rose-50/70",
                icon: "bg-rose-100 text-rose-700",
                value: "text-rose-900",
              };

  return (
    <div
      className={`rounded-xl border p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${toneClass.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-h-14 flex-col justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className={`text-2xl font-semibold leading-none ${toneClass.value}`}>
            {value}
          </p>
        </div>
        <div className={`rounded-lg p-2 ${toneClass.icon}`}>{icon}</div>
      </div>
    </div>
  );
}

type BookingRoomsListContentProps = {
  scope: BookingListScope;
  emptyMessage: string;
};

export default function BookingRoomsListContent({
  scope,
  emptyMessage,
}: BookingRoomsListContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useLoadProfile();
  const { updateBookingStatus, pendingAction } = useUpdateBookingStatus();
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmState, setConfirmState] = useState<{
    bookingId: string | number;
    type: "approve" | "reject";
  } | null>(null);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("q") ?? "";
  const createdAfter = searchParams.get("created_after") ?? "";
  const createdBefore = searchParams.get("created_before") ?? "";

  useEffect(() => {
    setPage(1);
  }, [status, search, createdAfter, createdBefore]);

  const { bookings, totalCount, isLoading, hasLoadedOnce, error } = useBookings(
    page,
    PAGE_SIZE,
    {
      status,
      createdAfter: createdAfter ? toStartOfDay(createdAfter) : "",
      createdBefore: createdBefore ? toEndOfDay(createdBefore) : "",
    },
    reloadKey,
    scope,
  );
  const { bookings: summarySourceBookings, totalCount: summaryTotalCount } =
    useBookings(1, 1000, {}, reloadKey, scope);

  const normalizedRole = normalizeRoleValue(profile?.role);
  const canReviewBookings =
    scope === "all" &&
    (normalizedRole === ROLE_VALUES.ADMIN ||
      normalizedRole === ROLE_VALUES.LECTURER ||
      normalizedRole === ROLE_VALUES.STAFF);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    const roomBookings = bookings.filter(
      (booking) => booking.roomName && booking.roomName !== "-",
    );

    if (!query) return roomBookings;
    return roomBookings.filter((booking) => {
      const haystack = [
        booking.code,
        booking.roomName,
        booking.requesterName,
        booking.purpose,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [bookings, search]);
  const summaryBookings = useMemo(
    () =>
      summarySourceBookings.filter(
        (booking) => booking.roomName && booking.roomName !== "-",
      ),
    [summarySourceBookings],
  );

  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || filteredBookings.length) / PAGE_SIZE),
  );
  const pendingCount = summaryBookings.filter(
    (item) => isPendingStatus(item.status),
  ).length;
  const approvedCount = summaryBookings.filter(
    (item) => item.status.toLowerCase() === "approved",
  ).length;
  const completedCount = summaryBookings.filter(
    (item) => item.status.toLowerCase() === "completed",
  ).length;
  const rejectedCount = summaryBookings.filter(
    (item) => item.status.toLowerCase() === "rejected",
  ).length;

  const handleBookingAction = async () => {
    if (!confirmState) return;

    const { bookingId, type } = confirmState;
    const result = await updateBookingStatus(bookingId, type);

    if (result.ok) {
      toast.success(
        type === "approve"
          ? "Pengajuan booking berhasil disetujui."
          : "Pengajuan booking berhasil ditolak.",
      );
      setReloadKey((prev) => prev + 1);
      setConfirmState(null);
      return;
    }

    toast.error(result.message);
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <SummaryCard
          label="Total Pengajuan"
          value={summaryTotalCount || summaryBookings.length}
          icon={<Building2 className="h-4 w-4" />}
          tone="blue"
        />
        <SummaryCard
          label="Pending"
          value={pendingCount}
          icon={<CalendarClock className="h-4 w-4" />}
          tone="amber"
        />
        <SummaryCard
          label="Approved"
          value={approvedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="emerald"
        />
        <SummaryCard
          label="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="violet"
        />
        <SummaryCard
          label="Rejected"
          value={rejectedCount}
          icon={<RotateCcw className="h-4 w-4" />}
          tone="rose"
        />
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1120px]">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr className="text-left text-sm">
              <th className="px-3 py-3 font-medium text-slate-50 whitespace-nowrap">
                Kode
              </th>
              <th className="px-3 py-3 font-medium text-slate-50 whitespace-nowrap">
                Ruangan
              </th>
              <th className="px-3 py-3 font-medium text-slate-50 whitespace-nowrap">
                Pemohon
              </th>
              <th className="px-3 py-3 font-medium text-slate-50 whitespace-nowrap">
                Waktu Mulai
              </th>
              <th className="px-3 py-3 font-medium text-slate-50 whitespace-nowrap">
                Waktu Selesai
              </th>
              <th className="px-3 py-3 font-medium text-slate-50 whitespace-nowrap">
                Tujuan
              </th>
              <th className="px-3 py-3 font-medium text-slate-50 whitespace-nowrap">
                Status
              </th>
              <th
                className="sticky right-0 z-20 bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 whitespace-nowrap shadow-[-1px_0_0_0_rgba(51,65,85,1)]"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading || !hasLoadedOnce ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data...
                  </div>
                </td>
              </tr>
            ) : filteredBookings.length ? (
              filteredBookings.map((booking) => (
                <tr
                  key={String(booking.id)}
                  className="border-b last:border-b-0"
                >
                  <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                    {booking.code}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{booking.roomName}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {booking.requesterName}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                    {formatDateTimeWib(booking.startTime)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                    {formatDateTimeWib(booking.endTime)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    {booking.purpose}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(booking.status)}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="sticky right-0 z-10 bg-white px-3 py-2.5 text-center shadow-[-1px_0_0_0_rgba(226,232,240,1)]">
                    <div className="flex items-center justify-center gap-2">
                      {canReviewBookings && isPendingStatus(booking.status) ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 w-8 rounded-md border border-emerald-200 bg-emerald-50 p-0 text-emerald-700 shadow-none hover:bg-emerald-100"
                            onClick={() =>
                              setConfirmState({
                                bookingId: booking.id,
                                type: "approve",
                              })
                            }
                            disabled={pendingAction.bookingId === booking.id}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 w-8 rounded-md border border-rose-200 bg-rose-50 p-0 text-rose-700 shadow-none hover:bg-rose-100"
                            onClick={() =>
                              setConfirmState({
                                bookingId: booking.id,
                                type: "reject",
                              })
                            }
                            disabled={pendingAction.bookingId === booking.id}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-300 text-slate-700"
                        onClick={() =>
                          router.push(
                            scope === "all"
                              ? `/booking-rooms/all/${booking.id}`
                              : `/booking-rooms/${booking.id}`,
                          )
                        }
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InventoryPagination
        page={page}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={setPage}
      />

      <BookingStatusConfirmDialog
        open={Boolean(confirmState)}
        actionType={confirmState?.type ?? null}
        onOpenChange={(open) => {
          if (!open) setConfirmState(null);
        }}
        onConfirm={handleBookingAction}
        isSubmitting={pendingAction.bookingId === confirmState?.bookingId}
      />
    </section>
  );
}
