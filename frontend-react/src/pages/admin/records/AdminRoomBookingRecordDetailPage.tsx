import { useState } from "react";
import { ArrowLeft, Check, ClipboardList, Loader2, X } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useBookingDetail } from "@/hooks/bookings/use-bookings";
import { useUpdateBookingStatus } from "@/hooks/bookings/use-update-booking-status";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import StatusConfirmDialog from "@/components/dialogs/StatusConfirmDialog";
import { getStatusDisplayLabel } from "@/lib/status";

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

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "-";
  return `${formatDateTime(start)} — ${formatDateTime(end)}`;
}

function DetailRow({
  label,
  value,
  onView,
}: {
  label: string;
  value: string;
  onView?: (() => void) | undefined;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-700">{label}</p>
      {onView ? (
        <button
          type="button"
          onClick={onView}
          className="w-full rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-left text-sm text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
        >
          {value || "-"}
        </button>
      ) : (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {value || "-"}
        </div>
      )}
    </div>
  );
}

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
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      {error ? (
        <div className="mx-auto max-w-3xl rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
          Memuat detail record...
        </div>
      ) : !booking ? (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
          Data record peminjaman ruangan tidak ditemukan.
        </div>
      ) : (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">Detail Booking Ruangan</p>
                <p className="text-sm text-slate-500">{booking.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {booking.status === "Pending" ? (
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
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate(backTo)}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <DetailRow
              label="Ruangan"
              value={booking.roomName}
              onView={
                booking.roomId
                  ? () =>
                      navigate(`/admin/inventory/rooms/${booking.roomId}`, {
                        state: { from: location.pathname },
                      })
                  : undefined
              }
            />
            <DetailRow
              label="Peminjam"
              value={booking.requesterName}
              onView={
                booking.requesterId
                  ? () =>
                      navigate(`/admin/user-management/detail/${booking.requesterId}`, {
                        state: { from: location.pathname },
                      })
                  : undefined
              }
            />
            <DetailRow label="Status" value={getStatusDisplayLabel(booking.status)} />
            <DetailRow label="Tujuan" value={booking.purpose} />
            <DetailRow label="Jumlah Orang" value={booking.attendeeCount} />
            <DetailRow label="Nama Orang" value={booking.attendeeNames} />
            <DetailRow label="Waktu" value={formatDateRange(booking.startTime, booking.endTime)} />
            <DetailRow label="Dibuat" value={formatDateTime(booking.createdAt)} />
            <DetailRow label="Diupdate" value={booking.updatedAt ? formatDateTime(booking.updatedAt) : "-"} />
            <DetailRow
              label="Disetujui Oleh"
              value={booking.approvedByName}
              onView={
                booking.approvedById
                  ? () =>
                      navigate(`/admin/user-management/detail/${booking.approvedById}`, {
                        state: { from: location.pathname },
                      })
                  : undefined
              }
            />
            <DetailRow
              label="Peralatan"
              value={
                booking.equipmentItems.length
                  ? booking.equipmentItems
                      .map((item) => `${item.equipmentName} (${item.quantity})`)
                      .join(", ")
                  : "-"
              }
            />
            <DetailRow label="Catatan" value={booking.note || "-"} />
          </div>
        </div>
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
