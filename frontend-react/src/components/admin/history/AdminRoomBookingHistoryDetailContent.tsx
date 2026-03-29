"use client";

import type { ReactNode } from "react";
import {
  CalendarClock,
  ClipboardList,
  MapPinned,
  NotebookPen,
} from "lucide-react";

import {
  AdminRecordAsideCard,
  AdminRecordAsideItem,
  AdminRecordDetailGrid,
  AdminRecordDetailItem,
  AdminRecordDetailSection,
  AdminRecordDetailShell,
} from "@/components/admin/history/AdminHistoryDetailLayout";
import type { BookingRow } from "@/hooks/bookings/use-bookings";
import { formatDateTimeWib } from "@/lib/date-format";

type Props = {
  booking: BookingRow | null;
  isLoading: boolean;
  error: string;
  onBack: () => void;
  backLabel?: string;
  actions?: ReactNode;
  showAside?: boolean;
  onOpenRoomDetail?: (roomId: string | number) => void;
  onOpenUserDetail?: (userId: string | number) => void;
};

export default function AdminRoomBookingRecordDetailContent({
  booking,
  isLoading,
  error,
  onBack,
  backLabel = "Kembali",
  actions,
  showAside = true,
  onOpenRoomDetail,
  onOpenUserDetail,
}: Props) {
  return (
    <>
      {error ? (
        <div className="w-full rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-5">
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
              <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-100" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
                <div className="space-y-2">
                  <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={`booking-main-${index}`} className="space-y-1.5">
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                    <div className="h-10 animate-pulse rounded-md border border-slate-200 bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
                <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={`booking-time-${index}`} className="space-y-1.5">
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                    <div className="h-10 animate-pulse rounded-md border border-slate-200 bg-slate-100" />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                <div className="h-16 animate-pulse rounded-md border border-slate-200 bg-slate-100" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
                <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={`booking-approval-${index}`} className="space-y-1.5">
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                    <div className="h-10 animate-pulse rounded-md border border-slate-200 bg-slate-100" />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                <div className="h-16 animate-pulse rounded-md border border-slate-200 bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      ) : !booking ? (
        <div className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-muted-foreground">
          Data record booking ruangan tidak ditemukan.
        </div>
      ) : (
        <AdminRecordDetailShell
          title="Detail Booking Ruangan"
          code={booking.code}
          icon={<ClipboardList className="h-5 w-5" />}
          status={booking.status}
          onBack={onBack}
          backLabel={backLabel}
          actions={actions}
          aside={
            showAside
              ? (
            <>
              <AdminRecordAsideCard title="Ringkasan Status">
                <AdminRecordAsideItem label="Status" value={booking.status} />
                <AdminRecordAsideItem
                  label="Diajukan"
                  value={formatDateTimeWib(booking.createdAt)}
                />
                <AdminRecordAsideItem
                  label="Diupdate"
                  value={formatDateTimeWib(booking.updatedAt)}
                />
                <AdminRecordAsideItem
                  label="Disetujui Oleh"
                  value={booking.approvedByName || "-"}
                />
              </AdminRecordAsideCard>
              <AdminRecordAsideCard title="Audit Singkat">
                <AdminRecordAsideItem label="Kode" value={booking.code} />
                <AdminRecordAsideItem label="Peminjam" value={booking.requesterName} />
                <AdminRecordAsideItem label="Ruangan" value={booking.roomName} />
              </AdminRecordAsideCard>
            </>
                )
              : undefined
          }
        >
          <AdminRecordDetailSection
            title="Informasi Utama"
            icon={<MapPinned className="h-5 w-5" />}
          >
            <AdminRecordDetailGrid>
              <AdminRecordDetailItem
                label="Ruangan"
                value={booking.roomName}
                hrefIcon={Boolean(booking.roomId)}
                onClick={
                  booking.roomId && onOpenRoomDetail
                    ? () => onOpenRoomDetail(booking.roomId)
                    : undefined
                }
              />
              <AdminRecordDetailItem
                label="Peminjam"
                value={booking.requesterName}
                hrefIcon={Boolean(booking.requesterId)}
                onClick={
                  booking.requesterId && onOpenUserDetail
                    ? () => onOpenUserDetail(booking.requesterId)
                    : undefined
                }
              />
              <AdminRecordDetailItem label="Status" value={booking.status} status />
              <AdminRecordDetailItem label="Tujuan" value={booking.purpose} />
              <AdminRecordDetailItem label="Jumlah Orang" value={booking.attendeeCount} />
              <AdminRecordDetailItem label="Nama Orang" value={booking.attendeeNames} />
            </AdminRecordDetailGrid>
          </AdminRecordDetailSection>

          <AdminRecordDetailSection
            title="Jadwal dan Peralatan"
            icon={<CalendarClock className="h-5 w-5" />}
          >
            <div className="space-y-3">
              <AdminRecordDetailGrid>
                <AdminRecordDetailItem
                  label="Waktu Mulai"
                  value={formatDateTimeWib(booking.startTime)}
                />
                <AdminRecordDetailItem
                  label="Waktu Selesai"
                  value={formatDateTimeWib(booking.endTime)}
                />
              </AdminRecordDetailGrid>
              <AdminRecordDetailItem
                label="Peralatan"
                value={
                  booking.equipmentItems.length
                    ? booking.equipmentItems
                        .map((item) => `${item.equipmentName} (${item.quantity})`)
                        .join(", ")
                    : "-"
                }
              />
            </div>
          </AdminRecordDetailSection>

          <AdminRecordDetailSection
            title="Catatan dan Persetujuan"
            icon={<NotebookPen className="h-5 w-5" />}
          >
            <AdminRecordDetailGrid>
              <AdminRecordDetailItem
                label="Disetujui Oleh"
                value={booking.approvedByName}
                hrefIcon={Boolean(booking.approvedById)}
                onClick={
                  booking.approvedById && onOpenUserDetail
                    ? () => onOpenUserDetail(booking.approvedById)
                    : undefined
                }
              />
              <AdminRecordDetailItem
                label="Email Approver"
                value={booking.approvedByEmail || "-"}
              />
            </AdminRecordDetailGrid>
            <div className="mt-3">
              <AdminRecordDetailItem
                label="Catatan Pemohon"
                value={booking.note || "-"}
              />
            </div>
          </AdminRecordDetailSection>
        </AdminRecordDetailShell>
      )}
    </>
  );
}
