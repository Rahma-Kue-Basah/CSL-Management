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
} from "@/components/admin/records/AdminRecordDetailLayout";
import type { BookingRow } from "@/hooks/bookings/use-bookings";
import { formatDateTimeWib } from "@/lib/date-time";

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
        <div className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-muted-foreground">
          Memuat detail record...
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
