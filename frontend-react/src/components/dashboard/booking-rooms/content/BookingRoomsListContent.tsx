"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Eye,
  Loader2,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { DashboardDetailReviewDialog } from "@/components/dashboard/layout/DashboardDetailReviewDialog";
import { DataPagination } from "@/components/shared/DataPagination";
import { RequestProgressDialog } from "@/components/shared/RequestProgressDialog";
import type { ProgressStepItem } from "@/components/shared/ProgressSteps";
import { TableActionIconButton } from "@/components/shared/TableActionIconButton";
import {
  useBookings,
  type BookingListScope,
} from "@/hooks/booking-rooms/use-bookings";
import { useLoadProfile } from "@/hooks/shared/profile/use-load-profile";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";
import {
  toEndOfDay,
  toStartOfDay,
} from "@/lib/date/utils";
import { formatDateTimeWib } from "@/lib/date/format";
import {
  canCurrentUserReviewPendingRequest,
  isWaitingForMentorApproval,
} from "@/lib/request/mentor-approval";
import { getBookingProgressFlow } from "@/lib/request/progress";
import {
  getStatusBadgeClass,
  getStatusDisplayLabel,
  getStatusSummaryTone,
  shouldShowReviewAction,
} from "@/lib/request/status";

const PAGE_SIZE = 10;
const TABLE_COLUMN_WIDTHS = [
  "10rem",
  "16rem",
  "12rem",
  "12rem",
  "12rem",
  "12rem",
  "10rem",
  "8rem",
] as const;

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
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [progressState, setProgressState] = useState<{
    code: string;
    steps: ProgressStepItem[];
  } | null>(null);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("q") ?? "";
  const room = searchParams.get("room") ?? "";
  const requestedBy = searchParams.get("requested_by") ?? "";
  const createdAfter = searchParams.get("created_after") ?? "";
  const createdBefore = searchParams.get("created_before") ?? "";
  const isActiveFilter = scope === "all" && status === "active";
  const resolvedEmptyMessage = isActiveFilter
    ? "Tidak ada pengajuan aktif peminjaman lab yang menjadi tanggung jawab Anda."
    : scope === "all"
      ? "Belum ada pengajuan peminjaman lab yang perlu Anda proses."
      : emptyMessage;

  useEffect(() => {
    setPage(1);
  }, [status, search, room, requestedBy, createdAfter, createdBefore]);

  const { bookings, totalCount, aggregates, isLoading, hasLoadedOnce, error } = useBookings(
    page,
    PAGE_SIZE,
    {
      q: search,
      status,
      room,
      requestedBy: scope === "all" ? requestedBy : "",
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
  const currentProfileId = String(profile?.id ?? "");

  const filteredBookings = useMemo(
    () =>
      bookings.filter(
        (booking) => booking.roomName && booking.roomName !== "-",
      ),
    [bookings],
  );
  const mentorBookings = useMemo(
    () =>
      filteredBookings.filter(
        (booking) =>
          isWaitingForMentorApproval(booking) &&
          booking.requesterMentorProfileId === currentProfileId,
      ),
    [currentProfileId, filteredBookings],
  );
  const showMentorApprovalSection =
    scope === "all" && normalizedRole === ROLE_VALUES.LECTURER;
  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || filteredBookings.length) / PAGE_SIZE),
  );
  const pendingCount = aggregates.pending;
  const approvedCount = aggregates.approved;
  const completedCount = aggregates.completed;
  const rejectedCount = aggregates.rejected;
  const expiredCount = aggregates.expired;

  const canShowReviewButton = (booking: (typeof filteredBookings)[number]) => {
    if (!canReviewBookings || !shouldShowReviewAction("booking", booking.status)) {
      return false;
    }

    if (
      isWaitingForMentorApproval(booking) &&
      booking.requesterMentorProfileId === currentProfileId
    ) {
      return false;
    }

    return true;
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

      {showMentorApprovalSection ? (
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Approval Dosen Pembimbing
            </h2>
            <p className="text-xs text-slate-600">
              Pengajuan Skripsi/TA yang menunggu persetujuan Anda sebagai dosen pembimbing.
            </p>
          </div>
          <div className="w-full max-w-full overflow-x-auto rounded-xl border border-amber-200 bg-white">
            <table className="w-full min-w-[1120px]">
              <colgroup>
                {TABLE_COLUMN_WIDTHS.map((width) => (
                  <col key={width} style={{ width }} />
                ))}
              </colgroup>
              <thead className="border-b border-amber-300 bg-amber-100">
                <tr className="text-left text-sm">
                  <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-900">Kode</th>
                  <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-900">Ruangan</th>
                  <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-900">Pemohon</th>
                  <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-900">Tujuan</th>
                  <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-900">Waktu Mulai</th>
                  <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-900">Waktu Selesai</th>
                  <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-900">Status</th>
                  <th className="sticky right-0 z-20 bg-amber-100 px-3 py-3 text-center font-medium whitespace-nowrap text-slate-900 shadow-[-1px_0_0_0_rgba(251,191,36,0.5)]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading || !hasLoadedOnce ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-5 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memuat data...
                      </div>
                    </td>
                  </tr>
                ) : mentorBookings.length ? (
                  mentorBookings.map((booking) => (
                    <tr key={`mentor-${String(booking.id)}`} className="border-b last:border-b-0">
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap text-slate-800">
                        {booking.code}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{booking.roomName}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{booking.requesterName}</td>
                      <td className="px-3 py-2.5 text-slate-700">{booking.purpose}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                        {formatDateTimeWib(booking.startTime)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                        {formatDateTimeWib(booking.endTime)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(booking.status)}`}
                        >
                          {getStatusDisplayLabel(booking.status)}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 bg-white px-3 py-2.5 text-center shadow-[-1px_0_0_0_rgba(254,243,199,1)]">
                        <div className="flex items-center justify-center gap-2">
                          {canCurrentUserReviewPendingRequest(
                            booking,
                            profile?.id,
                            profile?.role,
                          ) ? (
                            <TableActionIconButton
                              type="button"
                              label="Review"
                              icon={<ShieldCheck className="h-3.5 w-3.5" />}
                              className="w-8 rounded-md border border-sky-200 bg-sky-50 p-0 text-sky-700 shadow-none hover:bg-sky-100"
                              onClick={() => setReviewBookingId(String(booking.id))}
                            />
                          ) : null}
                          <TableActionIconButton
                            type="button"
                            label="Lihat detail"
                            icon={<Eye className="h-3.5 w-3.5" />}
                            className="w-8 rounded-md border border-slate-200 bg-slate-50 p-0 text-slate-700 shadow-none hover:bg-slate-100"
                            onClick={() => router.push(`/booking-rooms/approval/${booking.id}`)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-5 text-center text-slate-500">
                      Belum ada pengajuan yang menunggu persetujuan dosen pembimbing Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1120px]">
          <colgroup>
            {TABLE_COLUMN_WIDTHS.slice(0, showRequesterColumn ? 8 : 7).map((width) => (
              <col key={width} style={{ width }} />
            ))}
          </colgroup>
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
                Tujuan
              </th>
              <th className="px-3 py-3 font-medium text-slate-50 whitespace-nowrap">
                Waktu Mulai
              </th>
              <th className="px-3 py-3 font-medium text-slate-50 whitespace-nowrap">
                Waktu Selesai
              </th>
              
              <th className="px-3 py-3 font-medium text-slate-50 whitespace-nowrap">
                Status
              </th>
              <th className="sticky right-0 z-20 bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 whitespace-nowrap shadow-[-1px_0_0_0_rgba(51,65,85,1)]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading || !hasLoadedOnce ? (
              <tr>
                <td
                  colSpan={showRequesterColumn ? 8 : 7}
                  className="px-3 py-5 text-center text-slate-500"
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
                  <td className="px-3 py-2.5 text-slate-700">
                    {booking.purpose}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                    {formatDateTimeWib(booking.startTime)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                    {formatDateTimeWib(booking.endTime)}
                  </td>
                  
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setProgressState({
                          code: booking.code,
                          steps: getBookingProgressFlow(booking),
                        })
                      }
                      className={`inline-flex cursor-pointer rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(booking.status)}`}
                    >
                      {getStatusDisplayLabel(booking.status)}
                    </button>
                  </td>
                  <td className="sticky right-0 z-10 bg-white px-3 py-2.5 text-center shadow-[-1px_0_0_0_rgba(226,232,240,1)]">
                    <div className="flex items-center justify-center gap-2">
                      {canShowReviewButton(booking) ? (
                        <TableActionIconButton
                          type="button"
                          label="Review"
                          icon={<ShieldCheck className="h-3.5 w-3.5" />}
                          className="w-8 rounded-md border border-sky-200 bg-sky-50 p-0 text-sky-700 shadow-none hover:bg-sky-100"
                          onClick={() => setReviewBookingId(String(booking.id))}
                        />
                      ) : null}
                      <TableActionIconButton
                        type="button"
                        label="Lihat detail"
                        icon={<Eye className="h-3.5 w-3.5" />}
                        className="w-8 rounded-md border border-slate-200 bg-slate-50 p-0 text-slate-700 shadow-none hover:bg-slate-100"
                        onClick={() =>
                          router.push(
                            scope === "all"
                              ? `/booking-rooms/approval/${booking.id}`
                              : `/booking-rooms/${booking.id}`,
                          )
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={showRequesterColumn ? 8 : 7}
                  className="px-3 py-5 text-center text-slate-500"
                >
                  {resolvedEmptyMessage}
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
        itemLabel="peminjaman lab"
        isLoading={isLoading}
        onPageChange={setPage}
      />
      <DashboardDetailReviewDialog
        open={Boolean(reviewBookingId)}
        onOpenChange={(open) => {
          if (!open) setReviewBookingId(null);
        }}
        onActionComplete={() => setReloadKey((prev) => prev + 1)}
        context={
          reviewBookingId
            ? { kind: "booking", id: reviewBookingId }
            : null
        }
      />
      <RequestProgressDialog
        open={Boolean(progressState)}
        onOpenChange={(open) => {
          if (!open) setProgressState(null);
        }}
        title="Progress Peminjaman Lab"
        code={progressState?.code ?? ""}
        steps={progressState?.steps ?? []}
      />
    </section>
  );
}
