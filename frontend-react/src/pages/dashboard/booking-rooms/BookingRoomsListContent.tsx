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

import { DataPagination } from "@/components/shared/data-pagination";
import { Button } from "@/components/ui/button";
import {
  useBookings,
  type BookingListScope,
} from "@/hooks/bookings/use-bookings";
import { useUpdateBookingStatus } from "@/hooks/bookings/use-update-booking-status";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";
import StatusConfirmDialog from "@/components/dialogs/StatusConfirmDialog";
import {
  toEndOfDay,
  toStartOfDay,
} from "@/lib/date";
import { formatDateTimeWib } from "@/lib/date-format";
import {
  getStatusBadgeClass,
  getStatusDisplayLabel,
  getStatusSummaryTone,
} from "@/lib/status";

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
    <div
      className={`rounded-xl border p-3 shadow-[0_4px_14px_rgba(15,23,42,0.08)] ${toneClass.card}`}
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

  const { bookings, totalCount, aggregates, isLoading, hasLoadedOnce, error } = useBookings(
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

  const normalizedRole = normalizeRoleValue(profile?.role);
  const canReviewBookings =
    scope === "all" &&
    (normalizedRole === ROLE_VALUES.ADMIN ||
      normalizedRole === ROLE_VALUES.LECTURER ||
      normalizedRole === ROLE_VALUES.STAFF);
  const showRequesterColumn = scope === "all";

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
  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || filteredBookings.length) / PAGE_SIZE),
  );
  const pendingCount = aggregates.pending;
  const approvedCount = aggregates.approved;
  const completedCount = aggregates.completed;
  const rejectedCount = aggregates.rejected;
  const expiredCount = aggregates.expired;

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
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <SummaryCard
          label="Total Pengajuan"
          value={aggregates.total}
          icon={<Building2 className="h-4 w-4" />}
          tone={getStatusSummaryTone("total")}
        />
        <SummaryCard
          label="Pending"
          value={pendingCount}
          icon={<CalendarClock className="h-4 w-4" />}
          tone={getStatusSummaryTone("Pending")}
        />
        <SummaryCard
          label="Approved"
          value={approvedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone={getStatusSummaryTone("Approved")}
        />
        <SummaryCard
          label="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone={getStatusSummaryTone("Completed")}
        />
        <SummaryCard
          label="Rejected"
          value={rejectedCount}
          icon={<RotateCcw className="h-4 w-4" />}
          tone={getStatusSummaryTone("Rejected")}
        />
        <SummaryCard
          label="Expired"
          value={expiredCount}
          icon={<X className="h-4 w-4" />}
          tone={getStatusSummaryTone("Expired")}
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
              {showRequesterColumn ? (
                <th className="px-3 py-3 font-medium text-slate-50 whitespace-nowrap">
                  Pemohon
                </th>
              ) : null}
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
                  colSpan={showRequesterColumn ? 8 : 7}
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
                  {showRequesterColumn ? (
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {booking.requesterName}
                    </td>
                  ) : null}
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
                      {getStatusDisplayLabel(booking.status)}
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
                  colSpan={showRequesterColumn ? 8 : 7}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DataPagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount || filteredBookings.length}
        pageSize={PAGE_SIZE}
        itemLabel="booking ruangan"
        isLoading={isLoading}
        onPageChange={setPage}
      />

      <StatusConfirmDialog
        open={Boolean(confirmState)}
        actionType={confirmState?.type ?? null}
        onOpenChange={(open) => {
          if (!open) setConfirmState(null);
        }}
        onConfirm={handleBookingAction}
        isSubmitting={pendingAction.bookingId === confirmState?.bookingId}
        subjectLabel="pengajuan booking ruangan ini"
      />
    </section>
  );
}
