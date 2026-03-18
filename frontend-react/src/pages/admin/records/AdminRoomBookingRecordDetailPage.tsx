import { useState } from "react";
import {
  CalendarClock,
  Check,
  ClipboardList,
  Loader2,
  MapPinned,
  NotebookPen,
  X,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import StatusConfirmDialog from "@/components/dialogs/StatusConfirmDialog";
import {
  AdminRecordAsideCard,
  AdminRecordAsideItem,
  AdminRecordDetailGrid,
  AdminRecordDetailItem,
  AdminRecordDetailSection,
  AdminRecordDetailShell,
} from "@/components/admin/records/AdminRecordDetailLayout";
import { Button } from "@/components/ui/button";
import { useBookingDetail } from "@/hooks/bookings/use-bookings";
import { useUpdateBookingStatus } from "@/hooks/bookings/use-update-booking-status";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { formatDateTimeWib } from "@/lib/date-time";

export default function AdminRoomBookingRecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useLoadProfile();
  const { updateBookingStatus, pendingAction } = useUpdateBookingStatus();
  const [confirmType, setConfirmType] = useState<"approve" | "reject" | null>(
    null,
  );
  const backTo =
    typeof location.state?.from === "string"
      ? location.state.from
      : "/admin/records/room-bookings";

  const { booking, setBooking, isLoading, error } = useBookingDetail(id);

  const handleBookingAction = async () => {
    if (!booking || !confirmType) return;

    const type = confirmType;
    const result = await updateBookingStatus(booking.id, type);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    const now = new Date().toISOString();
    setBooking((current) =>
      current
        ? {
            ...current,
            status: type === "approve" ? "Approved" : "Rejected",
            updatedAt: now,
            approvedById:
              type === "approve"
                ? String(profile?.id ?? current.approvedById)
                : current.approvedById,
            approvedByName:
              type === "approve"
                ? profile?.name || current.approvedByName
                : current.approvedByName,
            approvedByEmail:
              type === "approve"
                ? profile?.email || current.approvedByEmail
                : current.approvedByEmail,
          }
        : current,
    );
    setConfirmType(null);

    toast.success(
      type === "approve"
        ? "Booking ruangan berhasil disetujui."
        : "Booking ruangan berhasil ditolak.",
    );
  };

  return (
    <section className="w-full min-w-0 space-y-4 px-4 pb-6">
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
          onBack={() => navigate(backTo)}
          actions={
            booking.status === "Pending" ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  className="border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => setConfirmType("approve")}
                  disabled={pendingAction.bookingId === booking.id}
                >
                  {pendingAction.bookingId === booking.id &&
                  pendingAction.type === "approve" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Setujui
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="border border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
                  onClick={() => setConfirmType("reject")}
                  disabled={pendingAction.bookingId === booking.id}
                >
                  {pendingAction.bookingId === booking.id &&
                  pendingAction.type === "reject" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Tolak
                </Button>
              </>
            ) : null
          }
          aside={
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
                <AdminRecordAsideItem
                  label="Peminjam"
                  value={booking.requesterName}
                />
                <AdminRecordAsideItem
                  label="Ruangan"
                  value={booking.roomName}
                />
              </AdminRecordAsideCard>
            </>
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
                hrefLabel={booking.roomId ? "Lihat detail" : undefined}
                onClick={
                  booking.roomId
                    ? () =>
                        navigate(`/admin/inventory/rooms/${booking.roomId}`, {
                          state: { from: location.pathname },
                        })
                    : undefined
                }
              />
              <AdminRecordDetailItem
                label="Peminjam"
                value={booking.requesterName}
                hrefLabel={booking.requesterId ? "Lihat user" : undefined}
                onClick={
                  booking.requesterId
                    ? () =>
                        navigate(
                          `/admin/user-management/detail/${booking.requesterId}`,
                          {
                            state: { from: location.pathname },
                          },
                        )
                    : undefined
                }
              />
              <AdminRecordDetailItem
                label="Status"
                value={booking.status}
                status
              />
              <AdminRecordDetailItem
                label="Tujuan"
                value={booking.purpose}
              />
              <AdminRecordDetailItem
                label="Jumlah Orang"
                value={booking.attendeeCount}
              />
              <AdminRecordDetailItem
                label="Nama Orang"
                value={booking.attendeeNames}
              />
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
                        .map(
                          (item) => `${item.equipmentName} (${item.quantity})`,
                        )
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
                hrefLabel={booking.approvedById ? "Lihat user" : undefined}
                onClick={
                  booking.approvedById
                    ? () =>
                        navigate(
                          `/admin/user-management/detail/${booking.approvedById}`,
                          {
                            state: { from: location.pathname },
                          },
                        )
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

      <StatusConfirmDialog
        open={Boolean(confirmType)}
        actionType={confirmType}
        onOpenChange={(open) => {
          if (!open) setConfirmType(null);
        }}
        onConfirm={handleBookingAction}
        isSubmitting={Boolean(booking) && pendingAction.bookingId === booking?.id}
        subjectLabel="pengajuan booking ruangan ini"
      />
    </section>
  );
}
