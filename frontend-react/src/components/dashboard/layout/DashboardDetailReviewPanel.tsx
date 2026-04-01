"use client";

import { useEffect, useState } from "react";
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
import {
  API_BOOKING_REVIEW_CHECK,
  API_BORROW_REVIEW_CHECK,
  API_USE_REVIEW_CHECK,
} from "@/constants/api";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";
import { authFetch } from "@/lib/auth";
import {
  useBookingDetail,
  type BookingRow,
} from "@/hooks/bookings/use-bookings";
import { useUpdateBookingStatus } from "@/hooks/bookings/use-update-booking-status";
import {
  useBorrowDetail,
  type BorrowRow,
} from "@/hooks/borrows/use-borrows";
import { useUpdateBorrowStatus } from "@/hooks/borrows/use-update-borrow-status";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import {
  usePengujianDetail,
  type PengujianRow,
} from "@/hooks/pengujians/use-pengujians";
import { useUpdatePengujianStatus } from "@/hooks/pengujians/use-update-pengujian-status";
import {
  useUseDetail,
  type UseRow,
} from "@/hooks/uses/use-uses";
import { useUpdateUseStatus } from "@/hooks/uses/use-update-use-status";
import { formatDateTimeWib } from "@/lib/date-format";

export type ReviewContext =
  | { kind: "booking"; id: string }
  | { kind: "use"; id: string }
  | { kind: "borrow"; id: string }
  | { kind: "pengujian"; id: string }
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

function getBorrowStatusHint(
  status: string,
  reviewer: boolean,
): {
  title: string;
  message: string;
  indicators?: string[];
  className?: string;
  titleClassName?: string;
  textClassName?: string;
} | null {
  if (isApprovedStatus(status)) {
    return {
      title: "Status sudah disetujui",
      message: reviewer
        ? "Pengajuan sudah lolos review dan siap masuk proses serah terima alat."
        : "Pengajuan sudah lolos review dan sedang menunggu proses serah terima alat.",
      indicators: reviewer
        ? ["Gunakan aksi Serah Terima setelah alat benar-benar diserahkan ke peminjam."]
        : ["PIC akan melanjutkan ke proses serah terima alat."],
      className: "border-sky-200 bg-sky-50/80",
      titleClassName: "text-sky-800",
      textClassName: "text-sky-900",
    };
  }

  if (canReturnStatus(status)) {
    return {
      title: "Alat sedang dipinjam",
      message: reviewer
        ? "Tahap review selesai. Langkah berikutnya adalah menerima alat kembali dari peminjam."
        : "Alat sedang dipinjam dan menunggu proses pengembalian.",
      indicators: reviewer
        ? ["Gunakan aksi Konfirmasi Pengembalian saat alat sudah diterima kembali."]
        : ["Setelah alat dikembalikan, PIC akan melakukan konfirmasi pengembalian."],
      className: "border-sky-200 bg-sky-50/80",
      titleClassName: "text-sky-800",
      textClassName: "text-sky-900",
    };
  }

  if (isInspectionPendingStatus(status)) {
    return {
      title: "Menunggu inspeksi akhir",
      message: reviewer
        ? "Pengembalian sudah diterima. Lanjutkan dengan pemeriksaan kondisi alat sebelum status diselesaikan."
        : "Pengembalian sudah diterima dan sedang menunggu hasil inspeksi akhir.",
      indicators: reviewer
        ? [
            "Gunakan Finalisasi Return jika alat kembali dengan baik.",
            "Gunakan Tandai Rusak atau Tandai Hilang jika ada temuan pada inspeksi.",
          ]
        : ["PIC akan memfinalisasi return atau menandai hasil inspeksi bila ada kendala."],
      className: "border-emerald-200 bg-emerald-50/80",
      titleClassName: "text-emerald-800",
      textClassName: "text-emerald-900",
    };
  }

  return null;
}

function getCompleteStatusHint(
  status: string,
  reviewer: boolean,
  labels: {
    readyTitle: string;
    reviewerMessage: string;
    requesterMessage: string;
    reviewerIndicator: string;
    requesterIndicator: string;
  },
): {
  title: string;
  message: string;
  indicators?: string[];
  className?: string;
  titleClassName?: string;
  textClassName?: string;
} | null {
  if (!isApprovedStatus(status)) {
    return null;
  }

  return {
    title: labels.readyTitle,
    message: reviewer ? labels.reviewerMessage : labels.requesterMessage,
    indicators: [reviewer ? labels.reviewerIndicator : labels.requesterIndicator],
    className: "border-sky-200 bg-sky-50/80",
    titleClassName: "text-sky-800",
    textClassName: "text-sky-900",
  };
}

function getBorrowStatusActionClass(status: string) {
  if (isApprovedStatus(status)) {
    return "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700";
  }

  if (normalizeStatus(status) === "borrowed") {
    return "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700";
  }

  if (normalizeStatus(status) === "overdue") {
    return "border-orange-600 bg-orange-600 text-white hover:bg-orange-700";
  }

  if (isInspectionPendingStatus(status)) {
    return "border-cyan-600 bg-cyan-600 text-white hover:bg-cyan-700";
  }

  return "border-slate-600 bg-slate-600 text-white hover:bg-slate-700";
}

function getPengujianStatusHint(
  status: string,
  reviewer: boolean,
): {
  title: string;
  message: string;
  indicators?: string[];
  className?: string;
  titleClassName?: string;
  textClassName?: string;
} | null {
  if (isApprovedStatus(status)) {
    return {
      title: "Pengujian siap diselesaikan",
      message: reviewer
        ? "Pengajuan sudah disetujui. Tandai sebagai selesai setelah proses pengujian sampel benar-benar selesai."
        : "Pengajuan sudah disetujui dan sedang menunggu proses pengujian sampel selesai.",
      indicators: reviewer
        ? ["Gunakan aksi Tandai Selesai setelah hasil pengujian sampel selesai diproses."]
        : ["Status akan diperbarui menjadi selesai oleh petugas setelah proses pengujian selesai."],
      className: "border-sky-200 bg-sky-50/80",
      titleClassName: "text-sky-800",
      textClassName: "text-sky-900",
    };
  }

  return null;
}

function isReviewerRole(role: string | null | undefined) {
  const normalizedRole = normalizeRoleValue(role);
  return (
    normalizedRole === ROLE_VALUES.ADMIN ||
    normalizedRole === ROLE_VALUES.LECTURER ||
    normalizedRole === ROLE_VALUES.STAFF
  );
}

type ReviewIssue = {
  label: string;
  value: string;
};

type ReviewCheckResponse = {
  issues?: ReviewIssue[];
  passed_indicators?: string[];
};

async function loadReviewIssues(url: string) {
  const response = await authFetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Gagal memuat review check (${response.status})`);
  }
  const payload = (await response.json()) as ReviewCheckResponse;
  return {
    issues: Array.isArray(payload.issues) ? payload.issues : [],
    passedIndicators: Array.isArray(payload.passed_indicators)
      ? payload.passed_indicators
      : [],
  };
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

function BookingReviewPanel({
  id,
  onActionComplete,
  initialBooking,
}: {
  id: string;
  onActionComplete?: () => void;
  initialBooking?: BookingRow | null;
}) {
  const { profile } = useLoadProfile();
  const { booking, setBooking, isLoading, error } = useBookingDetail(id, 0, {
    enabled: !initialBooking,
    initialBooking,
  });
  const { updateBookingStatus, pendingAction } = useUpdateBookingStatus();
  const [reviewIssues, setReviewIssues] = useState<ReviewIssue[]>([]);
  const [passedIndicators, setPassedIndicators] = useState<string[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [confirmType, setConfirmType] = useState<
    "approve" | "reject" | "complete" | null
  >(null);
  const shouldShowBookingReviewCheck = isPendingStatus(booking?.status ?? "");

  useEffect(() => {
    let isMounted = true;

    const loadIssues = async () => {
      if (!booking) {
        if (isMounted) {
          setReviewIssues([]);
          setPassedIndicators([]);
          setIssuesLoading(false);
        }
        return;
      }

      if (!shouldShowBookingReviewCheck) {
        if (isMounted) {
          setReviewIssues([]);
          setPassedIndicators([]);
          setIssuesLoading(false);
        }
        return;
      }

      setIssuesLoading(true);

      try {
        const result = await loadReviewIssues(API_BOOKING_REVIEW_CHECK(booking.id));
        if (isMounted) {
          setReviewIssues(result.issues);
          setPassedIndicators(result.passedIndicators);
          setIssuesLoading(false);
        }
      } catch {
        if (isMounted) {
          setReviewIssues([
            {
              label: "Review check belum tersedia",
              value: "Sistem tidak berhasil memeriksa catatan review saat ini. Cek ulang data sebelum approve.",
            },
          ]);
          setPassedIndicators([]);
          setIssuesLoading(false);
        }
      }
    };

    void loadIssues();
    return () => {
      isMounted = false;
    };
  }, [
    booking?.id,
    shouldShowBookingReviewCheck,
  ]);

  if (isLoading) return <PanelLoadingState />;
  if (error || !booking) {
    return <PanelErrorState message={error || "Data booking tidak ditemukan."} />;
  }

  const reviewer = isReviewerRole(profile?.role);
  const canReviewBooking = reviewer && isPendingStatus(booking.status);
  const canCompleteBooking = reviewer && isApprovedStatus(booking.status);
  const bookingStatusHint = getCompleteStatusHint(booking.status, reviewer, {
    readyTitle: "Booking siap diselesaikan",
    reviewerMessage:
      "Pengajuan sudah disetujui. Tandai sebagai selesai setelah waktu booking benar-benar berakhir.",
    requesterMessage:
      "Pengajuan sudah disetujui dan akan ditandai selesai oleh petugas setelah waktu booking berakhir.",
    reviewerIndicator:
      "Gunakan aksi Tandai Selesai setelah sesi peminjaman lab selesai.",
    requesterIndicator:
      "Status akan diperbarui menjadi selesai oleh petugas setelah sesi peminjaman lab berakhir.",
  });

  const handleBookingAction = async (rejectionNote?: string) => {
    if (!confirmType) return;

    const type = confirmType;
    const result = await updateBookingStatus(
      booking.id,
      type,
      type === "reject" ? { rejectionNote } : undefined,
    );
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    const now = new Date().toISOString();
    setBooking((current) =>
      current
        ? {
            ...current,
            status:
              type === "approve"
                ? "Approved"
                : type === "reject"
                  ? "Rejected"
                  : "Completed",
            updatedAt: now,
            rejectionNote:
              type === "reject" ? String(rejectionNote ?? current.rejectionNote ?? "") : current.rejectionNote,
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
            approvedAt: type === "approve" ? now : current.approvedAt,
            rejectedAt: type === "reject" ? now : current.rejectedAt,
            completedAt: type === "complete" ? now : current.completedAt,
          }
        : current,
    );
    setConfirmType(null);

    toast.success(
      type === "approve"
        ? "Pengajuan booking berhasil disetujui."
        : type === "reject"
          ? "Pengajuan booking berhasil ditolak."
          : "Pengajuan booking berhasil ditandai selesai.",
    );
    onActionComplete?.();
  };

  return (
    <>
      <RequestReviewCard
        status={booking.status}
        code={booking.code}
        meta={[
          { label: "Ruangan", value: booking.roomName || "-" },
          ...(booking.equipmentName && booking.equipmentName !== "-"
            ? [{ label: "Peralatan", value: booking.equipmentName }]
            : []),
          { label: "Pemohon", value: booking.requesterName },
          { label: "Tanggal Dibuat", value: formatDateTimeWib(booking.createdAt) },
          { label: "Ditujukan ke PIC", value: booking.roomPicName || "-" },
          {
            label: "Mulai booking",
            value: formatDateTimeWib(booking.startTime),
          },
        ]}
        checklist={shouldShowBookingReviewCheck ? reviewIssues : []}
        checklistLoading={shouldShowBookingReviewCheck ? issuesLoading : false}
        checklistEmptyMessage={
          shouldShowBookingReviewCheck
            ? "Tidak ada catatan review. Pengajuan ini siap diproses."
            : undefined
        }
        checklistPassedIndicators={shouldShowBookingReviewCheck ? passedIndicators : []}
        statusHintTitle={bookingStatusHint?.title}
        statusHintMessage={bookingStatusHint?.message}
        statusHintIndicators={bookingStatusHint?.indicators}
        statusHintClassName={bookingStatusHint?.className}
        statusHintTitleClassName={bookingStatusHint?.titleClassName}
        statusHintTextClassName={bookingStatusHint?.textClassName}
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
        {canCompleteBooking ? (
          <Button
            type="button"
            className="h-10 rounded-md border border-sky-600 bg-sky-600 px-4 text-white shadow-sm hover:bg-sky-700"
            onClick={() => setConfirmType("complete")}
            disabled={pendingAction.bookingId === booking.id}
          >
            <Check className="h-4 w-4" />
            Tandai Selesai
          </Button>
        ) : null}
      </RequestReviewCard>

      <StatusConfirmDialog
        open={Boolean(confirmType)}
        actionType={confirmType === "reject" ? "reject" : confirmType ? "approve" : null}
        onOpenChange={(open) => {
          if (!open) setConfirmType(null);
        }}
        onConfirm={handleBookingAction}
        isSubmitting={pendingAction.bookingId === booking.id}
        subjectLabel={
          confirmType === "complete"
            ? "pengajuan peminjaman lab ini sebagai selesai"
            : "pengajuan peminjaman lab ini"
        }
        requireReasonOnReject={confirmType === "reject"}
      />
    </>
  );
}

function UseReviewPanel({
  id,
  onActionComplete,
  initialUseItem,
}: {
  id: string;
  onActionComplete?: () => void;
  initialUseItem?: UseRow | null;
}) {
  const { profile } = useLoadProfile();
  const { useItem, setUseItem, isLoading, error } = useUseDetail(id, 0, {
    enabled: !initialUseItem,
    initialUseItem,
  });
  const { updateUseStatus, pendingAction } = useUpdateUseStatus();
  const [reviewIssues, setReviewIssues] = useState<ReviewIssue[]>([]);
  const [passedIndicators, setPassedIndicators] = useState<string[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [confirmType, setConfirmType] = useState<
    "approve" | "reject" | "complete" | null
  >(null);
  const shouldShowUseReviewCheck = isPendingStatus(useItem?.status ?? "");

  useEffect(() => {
    let isMounted = true;

    const loadIssues = async () => {
      if (!useItem) {
        if (isMounted) {
          setReviewIssues([]);
          setPassedIndicators([]);
          setIssuesLoading(false);
        }
        return;
      }

      if (!shouldShowUseReviewCheck) {
        if (isMounted) {
          setReviewIssues([]);
          setPassedIndicators([]);
          setIssuesLoading(false);
        }
        return;
      }

      setIssuesLoading(true);
      try {
        const result = await loadReviewIssues(API_USE_REVIEW_CHECK(useItem.id));
        if (isMounted) {
          setReviewIssues(result.issues);
          setPassedIndicators(result.passedIndicators);
          setIssuesLoading(false);
        }
      } catch {
        if (isMounted) {
          setReviewIssues([
            {
              label: "Review check belum tersedia",
              value: "Sistem tidak berhasil memeriksa catatan review saat ini. Cek ulang data sebelum approve.",
            },
          ]);
          setPassedIndicators([]);
          setIssuesLoading(false);
        }
      }
    };

    void loadIssues();
    return () => {
      isMounted = false;
    };
  }, [
    useItem?.id,
    shouldShowUseReviewCheck,
  ]);

  if (isLoading) return <PanelLoadingState />;
  if (error || !useItem) {
    return (
      <PanelErrorState message={error || "Data penggunaan alat tidak ditemukan."} />
    );
  }

  const reviewer = isReviewerRole(profile?.role);
  const canReviewUse = reviewer && isPendingStatus(useItem.status);
  const canCompleteUse = reviewer && isApprovedStatus(useItem.status);
  const useStatusHint = getCompleteStatusHint(useItem.status, reviewer, {
    readyTitle: "Penggunaan alat siap diselesaikan",
    reviewerMessage:
      "Pengajuan sudah disetujui. Tandai sebagai selesai setelah periode penggunaan alat benar-benar berakhir.",
    requesterMessage:
      "Pengajuan sudah disetujui dan akan ditandai selesai oleh petugas setelah periode penggunaan alat berakhir.",
    reviewerIndicator:
      "Gunakan aksi Tandai Selesai setelah penggunaan alat selesai.",
    requesterIndicator:
      "Status akan diperbarui menjadi selesai oleh petugas setelah penggunaan alat berakhir.",
  });

  const handleUseAction = async (rejectionNote?: string) => {
    if (!confirmType) return;

    const type = confirmType;
    const result = await updateUseStatus(
      useItem.id,
      type,
      type === "reject" ? { rejectionNote } : undefined,
    );
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    const now = new Date().toISOString();
    setUseItem((current) =>
      current
        ? {
            ...current,
            status:
              type === "approve"
                ? "Approved"
                : type === "reject"
                  ? "Rejected"
                  : "Completed",
            updatedAt: now,
            rejectionNote:
              type === "reject" ? String(rejectionNote ?? current.rejectionNote ?? "") : current.rejectionNote,
            approvedById:
              type === "approve"
                ? String(profile?.id ?? current.approvedById)
                : current.approvedById,
            approvedByName:
              type === "approve"
                ? profile?.name || current.approvedByName
                : current.approvedByName,
            approvedAt: type === "approve" ? now : current.approvedAt,
            rejectedAt: type === "reject" ? now : current.rejectedAt,
            completedAt: type === "complete" ? now : current.completedAt,
          }
        : current,
    );
    setConfirmType(null);

    toast.success(
      type === "approve"
        ? "Pengajuan penggunaan alat berhasil disetujui."
        : type === "reject"
          ? "Pengajuan penggunaan alat berhasil ditolak."
          : "Pengajuan penggunaan alat berhasil ditandai selesai.",
    );
    onActionComplete?.();
  };

  return (
    <>
      <RequestReviewCard
        status={useItem.status}
        code={useItem.code}
        meta={[
          { label: "Alat", value: useItem.equipmentName || "-" },
          { label: "Ruangan", value: useItem.roomName || "-" },
          { label: "Pemohon", value: useItem.requesterName },
          { label: "Tanggal Dibuat", value: formatDateTimeWib(useItem.createdAt) },
          { label: "Ditujukan ke PIC", value: useItem.roomPicName || "-" },
          {
            label: "Mulai penggunaan alat",
            value: formatDateTimeWib(useItem.startTime),
          },
        ]}
        checklist={shouldShowUseReviewCheck ? reviewIssues : []}
        checklistLoading={shouldShowUseReviewCheck ? issuesLoading : false}
        checklistEmptyMessage={
          shouldShowUseReviewCheck
            ? "Tidak ada catatan review. Pengajuan ini siap diproses."
            : undefined
        }
        checklistPassedIndicators={shouldShowUseReviewCheck ? passedIndicators : []}
        statusHintTitle={useStatusHint?.title}
        statusHintMessage={useStatusHint?.message}
        statusHintIndicators={useStatusHint?.indicators}
        statusHintClassName={useStatusHint?.className}
        statusHintTitleClassName={useStatusHint?.titleClassName}
        statusHintTextClassName={useStatusHint?.textClassName}
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
        {canCompleteUse ? (
          <Button
            type="button"
            className="h-10 rounded-md border border-sky-600 bg-sky-600 px-4 text-white shadow-sm hover:bg-sky-700"
            onClick={() => setConfirmType("complete")}
            disabled={pendingAction.useId === useItem.id}
          >
            <Check className="h-4 w-4" />
            Tandai Selesai
          </Button>
        ) : null}
      </RequestReviewCard>

      <StatusConfirmDialog
        open={Boolean(confirmType)}
        actionType={confirmType === "reject" ? "reject" : confirmType ? "approve" : null}
        onOpenChange={(open) => {
          if (!open) setConfirmType(null);
        }}
        onConfirm={handleUseAction}
        isSubmitting={pendingAction.useId === useItem.id}
        subjectLabel={
          confirmType === "complete"
            ? "pengajuan penggunaan alat ini sebagai selesai"
            : "pengajuan penggunaan alat ini"
        }
        requireReasonOnReject={confirmType === "reject"}
      />
    </>
  );
}

function BorrowReviewPanel({
  id,
  onActionComplete,
  initialBorrow,
}: {
  id: string;
  onActionComplete?: () => void;
  initialBorrow?: BorrowRow | null;
}) {
  const { profile } = useLoadProfile();
  const { borrow, setBorrow, isLoading, error } = useBorrowDetail(id, 0, {
    enabled: !initialBorrow,
    initialBorrow,
  });
  const { updateBorrowStatus, pendingAction } = useUpdateBorrowStatus();
  const [reviewIssues, setReviewIssues] = useState<ReviewIssue[]>([]);
  const [passedIndicators, setPassedIndicators] = useState<string[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [confirmType, setConfirmType] = useState<
    "approve" | "reject" | "handover" | "finalize_return" | null
  >(null);
  const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false);
  const [inspectionAction, setInspectionAction] = useState<
    "mark_damaged" | "mark_lost" | null
  >(null);
  const [inspectionNote, setInspectionNote] = useState("");
  const shouldShowBorrowReviewCheck = isPendingStatus(borrow?.status ?? "");

  useEffect(() => {
    let isMounted = true;

    const loadIssues = async () => {
      if (!borrow) {
        if (isMounted) {
          setReviewIssues([]);
          setPassedIndicators([]);
          setIssuesLoading(false);
        }
        return;
      }

      if (!shouldShowBorrowReviewCheck) {
        if (isMounted) {
          setReviewIssues([]);
          setPassedIndicators([]);
          setIssuesLoading(false);
        }
        return;
      }

      setIssuesLoading(true);
      try {
        const result = await loadReviewIssues(API_BORROW_REVIEW_CHECK(borrow.id));
        if (isMounted) {
          setReviewIssues(result.issues);
          setPassedIndicators(result.passedIndicators);
          setIssuesLoading(false);
        }
      } catch {
        if (isMounted) {
          setReviewIssues([
            {
              label: "Review check belum tersedia",
              value: "Sistem tidak berhasil memeriksa catatan review saat ini. Cek ulang data sebelum approve.",
            },
          ]);
          setPassedIndicators([]);
          setIssuesLoading(false);
        }
      }
    };

    void loadIssues();
    return () => {
      isMounted = false;
    };
  }, [
    borrow?.id,
    shouldShowBorrowReviewCheck,
  ]);

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
  const borrowStatusHint = getBorrowStatusHint(borrow.status, reviewer);
  const borrowStatusActionClass = getBorrowStatusActionClass(borrow.status);

  const handleBorrowAction = async (rejectionNote?: string) => {
    if (!confirmType) return;

    const type = confirmType;
    const result = await updateBorrowStatus(
      borrow.id,
      type,
      type === "reject" ? { rejectionNote } : undefined,
    );
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
            rejectionNote:
              type === "reject" ? String(rejectionNote ?? current.rejectionNote ?? "") : current.rejectionNote,
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
    onActionComplete?.();
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
    onActionComplete?.();
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
    onActionComplete?.();
  };

  const reviewMeta = [
    { label: "Alat", value: borrow.equipmentName || "-" },
    { label: "Ruangan", value: borrow.roomName || "-" },
    { label: "Pemohon", value: borrow.requesterName },
    { label: "Tanggal Dibuat", value: formatDateTimeWib(borrow.createdAt) },
    { label: "Ditujukan ke PIC", value: borrow.roomPicName || "-" },
    {
      label: "Mulai peminjaman",
      value: formatDateTimeWib(borrow.startTime),
    },
  ];

  return (
    <>
      <RequestReviewCard
        status={borrow.status}
        code={borrow.code}
        meta={reviewMeta}
        checklist={shouldShowBorrowReviewCheck ? reviewIssues : []}
        checklistLoading={shouldShowBorrowReviewCheck ? issuesLoading : false}
        checklistEmptyMessage={
          shouldShowBorrowReviewCheck
            ? "Tidak ada catatan review. Pengajuan ini siap diproses."
            : undefined
        }
        checklistPassedIndicators={shouldShowBorrowReviewCheck ? passedIndicators : []}
        statusHintTitle={borrowStatusHint?.title}
        statusHintMessage={borrowStatusHint?.message}
        statusHintIndicators={borrowStatusHint?.indicators}
        statusHintClassName={borrowStatusHint?.className}
        statusHintTitleClassName={borrowStatusHint?.titleClassName}
        statusHintTextClassName={borrowStatusHint?.textClassName}
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
            className={`h-10 rounded-md border px-4 shadow-sm ${borrowStatusActionClass}`}
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
            className={`h-10 rounded-md border px-4 shadow-sm ${borrowStatusActionClass}`}
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
              className={`h-10 rounded-md border px-4 shadow-sm ${borrowStatusActionClass}`}
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
        requireReasonOnReject={confirmType === "reject"}
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

function PengujianReviewPanel({
  id,
  onActionComplete,
  initialPengujian,
}: {
  id: string;
  onActionComplete?: () => void;
  initialPengujian?: PengujianRow | null;
}) {
  const { profile } = useLoadProfile();
  const { pengujian, setPengujian, isLoading, error } = usePengujianDetail(id, {
    enabled: !initialPengujian,
    initialPengujian,
  });
  const { updatePengujianStatus, pendingAction } = useUpdatePengujianStatus();
  const [confirmType, setConfirmType] = useState<
    "approve" | "reject" | "complete" | null
  >(null);

  if (isLoading) return <PanelLoadingState />;
  if (error || !pengujian) {
    return (
      <PanelErrorState
        message={error || "Data pengujian sampel tidak ditemukan."}
      />
    );
  }

  const canReviewPengujian =
    isReviewerRole(profile?.role) && isPendingStatus(pengujian.status);
  const canCompletePengujian =
    isReviewerRole(profile?.role) && isApprovedStatus(pengujian.status);
  const pengujianStatusHint = getPengujianStatusHint(
    pengujian.status,
    isReviewerRole(profile?.role),
  );

  const handlePengujianAction = async () => {
    if (!confirmType) return;

    const type = confirmType;
    const result = await updatePengujianStatus(pengujian.id, type);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    const now = new Date().toISOString();
    setPengujian((current) =>
      current
        ? {
            ...current,
            status:
              type === "approve"
                ? "Approved"
                : type === "reject"
                  ? "Rejected"
                  : "Completed",
            updatedAt: now,
            approvedById:
              type === "approve"
                ? String(profile?.id ?? current.approvedById)
                : current.approvedById,
            approvedByName:
              type === "approve"
                ? profile?.name || current.approvedByName
                : current.approvedByName,
            approvedAt: type === "approve" ? now : current.approvedAt,
            rejectedAt: type === "reject" ? now : current.rejectedAt,
            completedAt: type === "complete" ? now : current.completedAt,
          }
        : current,
    );
    setConfirmType(null);

    toast.success(
      type === "approve"
        ? "Pengajuan pengujian sampel berhasil disetujui."
        : type === "reject"
          ? "Pengajuan pengujian sampel berhasil ditolak."
          : "Pengajuan pengujian sampel berhasil ditandai selesai.",
    );
    onActionComplete?.();
  };

  return (
    <>
      <RequestReviewCard
        status={pengujian.status}
        code={pengujian.code}
        meta={[
          { label: "Sampel", value: pengujian.sampleName || "-" },
          { label: "Jenis Sampel", value: pengujian.sampleType || "-" },
          { label: "Jenis Pengujian", value: pengujian.sampleTestingType || "-" },
          { label: "Pemohon", value: pengujian.name || "-" },
          { label: "Institusi", value: pengujian.institution || "-" },
          {
            label: "Tanggal Dibuat",
            value: formatDateTimeWib(pengujian.createdAt),
          },
        ]}
        statusHintTitle={pengujianStatusHint?.title}
        statusHintMessage={pengujianStatusHint?.message}
        statusHintIndicators={pengujianStatusHint?.indicators}
        statusHintClassName={pengujianStatusHint?.className}
        statusHintTitleClassName={pengujianStatusHint?.titleClassName}
        statusHintTextClassName={pengujianStatusHint?.textClassName}
      >
        {canReviewPengujian ? (
          <>
            <Button
              type="button"
              className="h-10 rounded-md border border-emerald-600 bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
              onClick={() => setConfirmType("approve")}
              disabled={pendingAction.pengujianId === pengujian.id}
            >
              <Check className="h-4 w-4" />
              Setujui
            </Button>
            <Button
              type="button"
              className="h-10 rounded-md border border-rose-600 bg-rose-600 px-4 text-white shadow-sm hover:bg-rose-700"
              onClick={() => setConfirmType("reject")}
              disabled={pendingAction.pengujianId === pengujian.id}
            >
              <X className="h-4 w-4" />
              Tolak
            </Button>
          </>
        ) : null}
        {canCompletePengujian ? (
          <Button
            type="button"
            className="h-10 rounded-md border border-sky-600 bg-sky-600 px-4 text-white shadow-sm hover:bg-sky-700"
            onClick={() => setConfirmType("complete")}
            disabled={pendingAction.pengujianId === pengujian.id}
          >
            <Check className="h-4 w-4" />
            Tandai Selesai
          </Button>
        ) : null}
      </RequestReviewCard>

      <StatusConfirmDialog
        open={Boolean(confirmType)}
        actionType={confirmType === "reject" ? "reject" : confirmType ? "approve" : null}
        onOpenChange={(open) => {
          if (!open) setConfirmType(null);
        }}
        onConfirm={handlePengujianAction}
        isSubmitting={pendingAction.pengujianId === pengujian.id}
        subjectLabel={
          confirmType === "complete"
            ? "pengujian sampel ini sebagai selesai"
            : "pengajuan pengujian sampel ini"
        }
      />
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
  if (parts[0] === "sample-testing" && parts[1] === "approval" && parts[2]) {
    return { kind: "pengujian", id: parts[2] };
  }

  return null;
}

export function DashboardDetailReviewPanel({
  context,
  onActionComplete,
  initialBooking,
  initialUseItem,
  initialBorrow,
  initialPengujian,
}: {
  context: Exclude<ReviewContext, null>;
  onActionComplete?: () => void;
  initialBooking?: BookingRow | null;
  initialUseItem?: UseRow | null;
  initialBorrow?: BorrowRow | null;
  initialPengujian?: PengujianRow | null;
}) {
  if (context.kind === "booking") {
    return (
      <BookingReviewPanel
        id={context.id}
        onActionComplete={onActionComplete}
        initialBooking={initialBooking}
      />
    );
  }

  if (context.kind === "use") {
    return (
      <UseReviewPanel
        id={context.id}
        onActionComplete={onActionComplete}
        initialUseItem={initialUseItem}
      />
    );
  }

  if (context.kind === "pengujian") {
    return (
      <PengujianReviewPanel
        id={context.id}
        onActionComplete={onActionComplete}
        initialPengujian={initialPengujian}
      />
    );
  }

  return (
    <BorrowReviewPanel
      id={context.id}
      onActionComplete={onActionComplete}
      initialBorrow={initialBorrow}
    />
  );
}
