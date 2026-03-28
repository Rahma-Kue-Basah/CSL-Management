"use client";

import { useMemo, useState } from "react";
import { Check, Handshake, Loader2, RotateCcw, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";

import StatusConfirmDialog from "@/components/dialogs/StatusConfirmDialog";
import { RequestReviewCard } from "@/components/shared/RequestReviewCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";
import { useBookingDetail } from "@/hooks/bookings/use-bookings";
import { useUpdateBookingStatus } from "@/hooks/bookings/use-update-booking-status";
import { useBorrowDetail } from "@/hooks/borrows/use-borrows";
import { useUpdateBorrowStatus } from "@/hooks/borrows/use-update-borrow-status";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { useUseDetail } from "@/hooks/uses/use-uses";
import { useUpdateUseStatus } from "@/hooks/uses/use-update-use-status";
import { formatDateTimeWib } from "@/lib/date-format";
import { getStatusDisplayLabel } from "@/lib/status";

type ReviewContext =
  | { kind: "booking"; id: string }
  | { kind: "use"; id: string }
  | { kind: "borrow"; id: string }
  | null;

function normalizeStatus(value: string) {
  return value.toLowerCase();
}

function isPendingStatus(value: string) {
  return normalizeStatus(value) === "pending";
}

function isApprovedStatus(value: string) {
  return normalizeStatus(value) === "approved";
}

function canReturnStatus(value: string) {
  const normalized = normalizeStatus(value);
  return normalized === "borrowed" || normalized === "overdue";
}

function isInspectionPendingStatus(value: string) {
  const normalized = normalizeStatus(value);
  return (
    normalized === "returned pending inspection" ||
    normalized === "returned_pending_inspection"
  );
}

function isReviewerRole(role: string | null | undefined) {
  const normalizedRole = normalizeRoleValue(role);
  return (
    normalizedRole === ROLE_VALUES.ADMIN ||
    normalizedRole === ROLE_VALUES.LECTURER ||
    normalizedRole === ROLE_VALUES.STAFF
  );
}

function PanelLoadingState() {
  return (
    <div className="rounded-lg border border-[#D2DDED] bg-white px-4 py-6 text-sm text-slate-500">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat review pengajuan...
      </div>
    </div>
  );
}

function PanelErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

function BookingReviewPanel({ id }: { id: string }) {
  const { profile } = useLoadProfile();
  const { booking, setBooking, isLoading, error } = useBookingDetail(id);
  const { updateBookingStatus, pendingAction } = useUpdateBookingStatus();
  const [confirmType, setConfirmType] = useState<"approve" | "reject" | null>(
    null,
  );

  if (isLoading) return <PanelLoadingState />;
  if (error || !booking) {
    return <PanelErrorState message={error || "Data booking tidak ditemukan."} />;
  }

  const canReviewBooking =
    isReviewerRole(profile?.role) && isPendingStatus(booking.status);

  const handleBookingAction = async () => {
    if (!confirmType) return;

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
        ? "Pengajuan booking berhasil disetujui."
        : "Pengajuan booking berhasil ditolak.",
    );
  };

  return (
    <>
      <RequestReviewCard
        status={booking.status}
        code={booking.code}
        meta={[
          { label: "Pemohon", value: booking.requesterName },
          { label: "Ditujukan ke PIC", value: booking.roomPicName || "-" },
          {
            label: "Batas waktu approval",
            value: formatDateTimeWib(booking.startTime),
          },
        ]}
      >
        {canReviewBooking ? (
          <>
            <Button
              type="button"
              className="h-10 rounded-md border border-emerald-600 bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
              onClick={() => setConfirmType("approve")}
              disabled={pendingAction.bookingId === booking.id}
            >
              <Check className="h-4 w-4" />
              Setujui
            </Button>
            <Button
              type="button"
              className="h-10 rounded-md border border-rose-600 bg-rose-600 px-4 text-white shadow-sm hover:bg-rose-700"
              onClick={() => setConfirmType("reject")}
              disabled={pendingAction.bookingId === booking.id}
            >
              <X className="h-4 w-4" />
              Tolak
            </Button>
          </>
        ) : null}
      </RequestReviewCard>

      <StatusConfirmDialog
        open={Boolean(confirmType)}
        actionType={confirmType}
        onOpenChange={(open) => {
          if (!open) setConfirmType(null);
        }}
        onConfirm={handleBookingAction}
        isSubmitting={pendingAction.bookingId === booking.id}
        subjectLabel="pengajuan booking ruangan ini"
      />
    </>
  );
}

function UseReviewPanel({ id }: { id: string }) {
  const { profile } = useLoadProfile();
  const { useItem, setUseItem, isLoading, error } = useUseDetail(id);
  const { updateUseStatus, pendingAction } = useUpdateUseStatus();
  const [confirmType, setConfirmType] = useState<"approve" | "reject" | null>(
    null,
  );

  if (isLoading) return <PanelLoadingState />;
  if (error || !useItem) {
    return (
      <PanelErrorState message={error || "Data penggunaan alat tidak ditemukan."} />
    );
  }

  const canReviewUse = isReviewerRole(profile?.role) && isPendingStatus(useItem.status);

  const handleUseAction = async () => {
    if (!confirmType) return;

    const type = confirmType;
    const result = await updateUseStatus(useItem.id, type);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    const now = new Date().toISOString();
    setUseItem((current) =>
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
          }
        : current,
    );
    setConfirmType(null);

    toast.success(
      type === "approve"
        ? "Pengajuan penggunaan alat berhasil disetujui."
        : "Pengajuan penggunaan alat berhasil ditolak.",
    );
  };

  return (
    <>
      <RequestReviewCard
        status={useItem.status}
        code={useItem.code}
        meta={[
          { label: "Pemohon", value: useItem.requesterName },
          { label: "Ditujukan ke PIC", value: useItem.roomPicName || "-" },
          {
            label: "Batas waktu approval",
            value: formatDateTimeWib(useItem.startTime),
          },
        ]}
      >
        {canReviewUse ? (
          <>
            <Button
              type="button"
              className="h-10 rounded-md border border-emerald-600 bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
              onClick={() => setConfirmType("approve")}
              disabled={pendingAction.useId === useItem.id}
            >
              <Check className="h-4 w-4" />
              Setujui
            </Button>
            <Button
              type="button"
              className="h-10 rounded-md border border-rose-600 bg-rose-600 px-4 text-white shadow-sm hover:bg-rose-700"
              onClick={() => setConfirmType("reject")}
              disabled={pendingAction.useId === useItem.id}
            >
              <X className="h-4 w-4" />
              Tolak
            </Button>
          </>
        ) : null}
      </RequestReviewCard>

      <StatusConfirmDialog
        open={Boolean(confirmType)}
        actionType={confirmType}
        onOpenChange={(open) => {
          if (!open) setConfirmType(null);
        }}
        onConfirm={handleUseAction}
        isSubmitting={pendingAction.useId === useItem.id}
        subjectLabel="pengajuan penggunaan alat ini"
      />
    </>
  );
}

function BorrowReviewPanel({ id }: { id: string }) {
  const { profile } = useLoadProfile();
  const { borrow, setBorrow, isLoading, error } = useBorrowDetail(id);
  const { updateBorrowStatus, pendingAction } = useUpdateBorrowStatus();
  const [confirmType, setConfirmType] = useState<
    "approve" | "reject" | "handover" | "finalize_return" | null
  >(null);
  const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false);
  const [inspectionAction, setInspectionAction] = useState<
    "mark_damaged" | "mark_lost" | null
  >(null);
  const [inspectionNote, setInspectionNote] = useState("");

  if (isLoading) return <PanelLoadingState />;
  if (error || !borrow) {
    return (
      <PanelErrorState message={error || "Data peminjaman alat tidak ditemukan."} />
    );
  }

  const reviewer = isReviewerRole(profile?.role);
  const canReviewBorrow = reviewer && isPendingStatus(borrow.status);
  const canHandoverBorrow = reviewer && isApprovedStatus(borrow.status);
  const canConfirmReturn = reviewer && canReturnStatus(borrow.status);
  const canFinalizeInspection =
    reviewer && isInspectionPendingStatus(borrow.status);

  const handleBorrowAction = async () => {
    if (!confirmType) return;

    const type = confirmType;
    const result = await updateBorrowStatus(borrow.id, type);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    const now = new Date().toISOString();
    setBorrow((current) =>
      current
        ? {
            ...current,
            status:
              type === "approve"
                ? "Approved"
                : type === "reject"
                  ? "Rejected"
                  : type === "handover"
                    ? "Borrowed"
                    : "Returned",
            updatedAt: now,
            approvedById:
              type === "approve"
                ? String(profile?.id ?? current.approvedById)
                : current.approvedById,
            approvedByName:
              type === "approve"
                ? profile?.name || current.approvedByName
                : current.approvedByName,
          }
        : current,
    );
    setConfirmType(null);

    toast.success(
      type === "approve"
        ? "Pengajuan peminjaman alat berhasil disetujui."
        : type === "reject"
          ? "Pengajuan peminjaman alat berhasil ditolak."
          : type === "handover"
            ? "Serah-terima alat berhasil dikonfirmasi."
            : "Pengembalian alat berhasil difinalisasi.",
    );
  };

  const handleReturnSubmit = async () => {
    const now = new Date().toISOString();
    const result = await updateBorrowStatus(borrow.id, "receive_return", {
      endTimeActual: now,
    });

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setBorrow((current) =>
      current
        ? {
            ...current,
            status: "Returned Pending Inspection",
            updatedAt: now,
            endTimeActual: now,
          }
        : current,
    );
    setIsReturnConfirmOpen(false);
    toast.success("Pengembalian alat diterima dan menunggu inspeksi.");
  };

  const handleInspectionSubmit = async () => {
    if (!inspectionAction || !inspectionNote.trim()) {
      toast.error("Catatan inspeksi wajib diisi.");
      return;
    }

    const result = await updateBorrowStatus(borrow.id, inspectionAction, {
      inspectionNote,
    });

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    const now = new Date().toISOString();
    setBorrow((current) =>
      current
        ? {
            ...current,
            status: "Lost/Damaged",
            updatedAt: now,
            inspectionNote: inspectionNote.trim(),
          }
        : current,
    );
    setInspectionAction(null);
    setInspectionNote("");
    toast.success(
      inspectionAction === "mark_damaged"
        ? "Borrow ditandai sebagai rusak."
        : "Borrow ditandai sebagai hilang.",
    );
  };

  const reviewMeta = useMemo(
    () => [
      { label: "Pemohon", value: borrow.requesterName },
      { label: "Ditujukan ke PIC", value: borrow.roomPicName || "-" },
      {
        label: "Batas waktu approval",
        value: formatDateTimeWib(borrow.startTime),
      },
    ],
    [borrow],
  );

  return (
    <>
      <RequestReviewCard
        status={borrow.status}
        code={borrow.code}
        meta={reviewMeta}
      >
        {canReviewBorrow ? (
          <>
            <Button
              type="button"
              className="h-10 rounded-md border border-emerald-600 bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
              onClick={() => setConfirmType("approve")}
              disabled={pendingAction.borrowId === borrow.id}
            >
              <Check className="h-4 w-4" />
              Setujui
            </Button>
            <Button
              type="button"
              className="h-10 rounded-md border border-rose-600 bg-rose-600 px-4 text-white shadow-sm hover:bg-rose-700"
              onClick={() => setConfirmType("reject")}
              disabled={pendingAction.borrowId === borrow.id}
            >
              <X className="h-4 w-4" />
              Tolak
            </Button>
          </>
        ) : null}
        {canHandoverBorrow ? (
          <Button
            type="button"
            className="h-10 rounded-md border border-sky-600 bg-sky-600 px-4 text-white shadow-sm hover:bg-sky-700"
            onClick={() => setConfirmType("handover")}
            disabled={pendingAction.borrowId === borrow.id}
          >
            <Handshake className="h-4 w-4" />
            Serah Terima
          </Button>
        ) : null}
        {canConfirmReturn ? (
          <Button
            type="button"
            className="h-10 rounded-md border border-sky-600 bg-sky-600 px-4 text-white shadow-sm hover:bg-sky-700"
            onClick={() => setIsReturnConfirmOpen(true)}
            disabled={pendingAction.borrowId === borrow.id}
          >
            <RotateCcw className="h-4 w-4" />
            Konfirmasi Pengembalian
          </Button>
        ) : null}
        {canFinalizeInspection ? (
          <>
            <Button
              type="button"
              className="h-10 rounded-md border border-emerald-600 bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
              onClick={() => setConfirmType("finalize_return")}
              disabled={pendingAction.borrowId === borrow.id}
            >
              <ShieldCheck className="h-4 w-4" />
              Finalisasi Return
            </Button>
            <Button
              type="button"
              className="h-10 rounded-md border border-amber-600 bg-amber-600 px-4 text-white shadow-sm hover:bg-amber-700"
              onClick={() => setInspectionAction("mark_damaged")}
              disabled={pendingAction.borrowId === borrow.id}
            >
              <TriangleAlert className="h-4 w-4" />
              Tandai Rusak
            </Button>
            <Button
              type="button"
              className="h-10 rounded-md border border-rose-600 bg-rose-600 px-4 text-white shadow-sm hover:bg-rose-700"
              onClick={() => setInspectionAction("mark_lost")}
              disabled={pendingAction.borrowId === borrow.id}
            >
              <X className="h-4 w-4" />
              Tandai Hilang
            </Button>
          </>
        ) : null}
      </RequestReviewCard>

      <StatusConfirmDialog
        open={Boolean(confirmType)}
        actionType={
          confirmType === "reject" ? "reject" : confirmType ? "approve" : null
        }
        onOpenChange={(open) => {
          if (!open) setConfirmType(null);
        }}
        onConfirm={handleBorrowAction}
        isSubmitting={pendingAction.borrowId === borrow.id}
        subjectLabel={
          confirmType === "handover"
            ? "serah-terima alat ini"
            : confirmType === "finalize_return"
              ? "finalisasi pengembalian alat ini"
              : "pengajuan peminjaman alat ini"
        }
      />

      <StatusConfirmDialog
        open={isReturnConfirmOpen}
        actionType="approve"
        onOpenChange={setIsReturnConfirmOpen}
        onConfirm={handleReturnSubmit}
        isSubmitting={
          pendingAction.borrowId === borrow.id &&
          pendingAction.type === "receive_return"
        }
        subjectLabel="pengembalian alat ini"
      />

      <AlertDialog
        open={Boolean(inspectionAction)}
        onOpenChange={(open) => {
          if (!open) {
            setInspectionAction(null);
            setInspectionNote("");
          }
        }}
      >
        <AlertDialogContent className="max-w-lg border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>
              {inspectionAction === "mark_damaged"
                ? "Tandai Alat Rusak"
                : "Tandai Alat Hilang"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isi catatan inspeksi sebelum menyimpan hasil pemeriksaan alat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Catatan inspeksi</p>
            <Textarea
              value={inspectionNote}
              onChange={(event) => setInspectionNote(event.target.value)}
              rows={4}
              placeholder="Tuliskan detail hasil inspeksi..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction.borrowId === borrow.id}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleInspectionSubmit}
              disabled={pendingAction.borrowId === borrow.id}
              className={
                inspectionAction === "mark_damaged"
                  ? "rounded-md bg-amber-600 text-white hover:bg-amber-700"
                  : "rounded-md bg-rose-600 text-white hover:bg-rose-700"
              }
            >
              {pendingAction.borrowId === borrow.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : inspectionAction === "mark_damaged" ? (
                "Ya, Tandai Rusak"
              ) : (
                "Ya, Tandai Hilang"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function parseReviewContext(pathname: string): ReviewContext {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "booking-rooms" && parts[1] === "approval" && parts[2]) {
    return { kind: "booking", id: parts[2] };
  }
  if (parts[0] === "use-equipment" && parts[1] === "approval" && parts[2]) {
    return { kind: "use", id: parts[2] };
  }
  if (parts[0] === "borrow-equipment" && parts[1] === "approval" && parts[2]) {
    return { kind: "borrow", id: parts[2] };
  }

  return null;
}

export function DashboardDetailReviewPanel({
  context,
}: {
  context: Exclude<ReviewContext, null>;
}) {
  if (context.kind === "booking") {
    return <BookingReviewPanel id={context.id} />;
  }

  if (context.kind === "use") {
    return <UseReviewPanel id={context.id} />;
  }

  return <BorrowReviewPanel id={context.id} />;
}
