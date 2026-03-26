"use client";

import { useState } from "react";
import { Steps } from "rsuite";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardList,
  Handshake,
  Hourglass,
  Loader2,
  NotebookPen,
  RotateCcw,
  ShieldCheck,
  Truck,
  TriangleAlert,
  Wrench,
  X,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import StatusConfirmDialog from "@/components/dialogs/StatusConfirmDialog";
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
import { useBorrowDetail } from "@/hooks/borrows/use-borrows";
import { useUpdateBorrowStatus } from "@/hooks/borrows/use-update-borrow-status";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { formatDateTimeWib } from "@/lib/date-format";
import { getStatusBadgeClass, getStatusDisplayLabel } from "@/lib/status";

type BorrowFlowStep = {
  key: string;
  label: string;
  time?: string;
  state: "finish" | "process" | "wait" | "error";
};

function normalizeStatus(value: string) {
  return value.toLowerCase();
}

function isPendingStatus(value: string) {
  return normalizeStatus(value) === "pending";
}

function canReturnStatus(value: string) {
  const normalized = normalizeStatus(value);
  return normalized === "borrowed" || normalized === "overdue";
}

function isApprovedStatus(value: string) {
  return normalizeStatus(value) === "approved";
}

function isInspectionPendingStatus(value: string) {
  const normalized = normalizeStatus(value);
  return (
    normalized === "returned pending inspection" ||
    normalized === "returned_pending_inspection"
  );
}

function getBorrowFlow(item: {
  status: string;
  createdAt: string;
  updatedAt: string;
  endTimeActual: string;
}) {
  const status = normalizeStatus(item.status);

  const baseSteps: BorrowFlowStep[] = [
    {
      key: "submitted",
      label: "Diajukan",
      time: formatDateTimeWib(item.createdAt),
      state: "finish",
    },
    {
      key: "review",
      label: "Diproses",
      state: "wait",
    },
    {
      key: "approved",
      label: "Disetujui",
      state: "wait",
    },
    {
      key: "borrowed",
      label: "Dipinjam",
      state: "wait",
    },
    {
      key: "returned",
      label: "Diterima Kembali",
      state: "wait",
    },
    {
      key: "inspection",
      label: "Inspeksi",
      state: "wait",
    },
    {
      key: "completed",
      label: "Selesai",
      state: "wait",
    },
  ];

  if (status === "pending") {
    baseSteps[1].state = "process";
    return baseSteps;
  }
  if (status === "approved") {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "process";
    baseSteps[2].time = formatDateTimeWib(item.updatedAt);
    return baseSteps;
  }
  if (status === "borrowed") {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "finish";
    baseSteps[2].time = formatDateTimeWib(item.updatedAt);
    baseSteps[3].state = "process";
    return baseSteps;
  }
  if (status === "returned") {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "finish";
    baseSteps[3].state = "finish";
    baseSteps[4].state = "finish";
    baseSteps[4].time = formatDateTimeWib(item.endTimeActual || item.updatedAt);
    baseSteps[5].state = "finish";
    baseSteps[5].time = formatDateTimeWib(item.updatedAt);
    baseSteps[6].state = "finish";
    baseSteps[6].time = formatDateTimeWib(item.updatedAt);
    return baseSteps;
  }
  if (
    status === "returned pending inspection" ||
    status === "returned_pending_inspection"
  ) {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "finish";
    baseSteps[3].state = "finish";
    baseSteps[4].state = "process";
    baseSteps[4].time = formatDateTimeWib(item.endTimeActual || item.updatedAt);
    return baseSteps;
  }
  if (status === "rejected") {
    baseSteps[1].state = "error";
    baseSteps[1].label = "Ditolak";
    baseSteps[1].time = formatDateTimeWib(item.updatedAt);
    return baseSteps.slice(0, 2);
  }
  if (status === "expired") {
    baseSteps[1].state = "error";
    baseSteps[1].label = "Expired";
    baseSteps[1].time = formatDateTimeWib(item.updatedAt);
    return baseSteps.slice(0, 2);
  }
  if (status === "overdue") {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "finish";
    baseSteps[3].state = "error";
    baseSteps[3].label = "Terlambat";
    baseSteps[3].time = formatDateTimeWib(item.updatedAt);
    return baseSteps.slice(0, 4);
  }
  if (status === "lost/damaged") {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "finish";
    baseSteps[3].state = "finish";
    baseSteps[4].state = "finish";
    baseSteps[4].time = formatDateTimeWib(item.endTimeActual || item.updatedAt);
    baseSteps[5].state = "error";
    baseSteps[5].label = "Hilang/Rusak";
    baseSteps[5].time = formatDateTimeWib(item.updatedAt);
    return baseSteps;
  }

  baseSteps[1].state = "process";
  return baseSteps;
}

function BorrowFlow({ steps }: { steps: BorrowFlowStep[] }) {
  const currentIndex = Math.max(
    0,
    steps.findIndex(
      (step) => step.state === "process" || step.state === "error",
    ),
  );

  return (
    <div className="booking-flow mt-3 overflow-x-auto pb-1">
      <Steps current={currentIndex} className="min-w-[760px]">
        {steps.map((step) => (
          <Steps.Item
            key={step.key}
            title={step.label}
            status={step.state}
            description={step.time || " "}
          />
        ))}
      </Steps>
    </div>
  );
}

export default function BorrowEquipmentDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useLoadProfile();
  const { updateBorrowStatus, pendingAction } = useUpdateBorrowStatus();
  const { id } = useParams();
  const { borrow: item, setBorrow, isLoading, error } = useBorrowDetail(id);
  const [confirmType, setConfirmType] = useState<
    "approve" | "reject" | "handover" | "receive_return" | "finalize_return" | null
  >(null);
  const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false);
  const [inspectionAction, setInspectionAction] = useState<
    "mark_damaged" | "mark_lost" | null
  >(null);
  const [inspectionNote, setInspectionNote] = useState("");

  const isAllPage = location.pathname.startsWith("/borrow-equipment/all/");
  const backHref = isAllPage ? "/borrow-equipment/all" : "/borrow-equipment";
  const backLabel = isAllPage
    ? "Kembali ke Daftar Pengajuan"
    : "Kembali ke Pengajuan Saya";

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Memuat detail pengajuan...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-3">
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
        <Button type="button" variant="outline" onClick={() => navigate(backHref)}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="space-y-3">
        <p className="text-sm text-slate-600">Data pengajuan peminjaman alat tidak ditemukan.</p>
        <Button type="button" variant="outline" onClick={() => navigate(backHref)}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      </section>
    );
  }

  const normalizedRole = normalizeRoleValue(profile?.role);
  const canReviewBorrow =
    isAllPage &&
    (normalizedRole === ROLE_VALUES.ADMIN ||
      normalizedRole === ROLE_VALUES.LECTURER ||
      normalizedRole === ROLE_VALUES.STAFF) &&
    isPendingStatus(item.status);
  const canHandoverBorrow =
    isAllPage &&
    (normalizedRole === ROLE_VALUES.ADMIN ||
      normalizedRole === ROLE_VALUES.LECTURER ||
      normalizedRole === ROLE_VALUES.STAFF) &&
    isApprovedStatus(item.status);
  const canConfirmReturn =
    isAllPage &&
    (normalizedRole === ROLE_VALUES.ADMIN ||
      normalizedRole === ROLE_VALUES.LECTURER ||
      normalizedRole === ROLE_VALUES.STAFF) &&
    canReturnStatus(item.status);
  const canFinalizeInspection =
    isAllPage &&
    (normalizedRole === ROLE_VALUES.ADMIN ||
      normalizedRole === ROLE_VALUES.LECTURER ||
      normalizedRole === ROLE_VALUES.STAFF) &&
    isInspectionPendingStatus(item.status);

  const handleBorrowAction = async () => {
    if (!confirmType) return;

    const type = confirmType;
    const result = await updateBorrowStatus(item.id, type);

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
                    : type === "receive_return"
                      ? "Returned Pending Inspection"
                      : "Returned",
            updatedAt: now,
            endTimeActual:
              type === "receive_return"
                ? now
                : current.endTimeActual,
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
            : type === "receive_return"
              ? "Pengembalian alat diterima dan menunggu inspeksi."
              : "Pengembalian alat berhasil difinalisasi.",
    );
  };

  const handleReturnSubmit = async () => {
    const now = new Date().toISOString();
    const result = await updateBorrowStatus(item.id, "receive_return", {
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

    const result = await updateBorrowStatus(item.id, inspectionAction, {
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

  const flowSteps = getBorrowFlow({
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    endTimeActual: item.endTimeActual,
  });

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div>
          <p className="text-xs text-slate-300">Detail Request</p>
          <h2 className="mt-1 text-xl font-bold text-slate-50">{item.code}</h2>
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(item.status)}`}
            >
              {getStatusDisplayLabel(item.status)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canReviewBorrow ? (
            <>
              <Button
                type="button"
                className="h-10 rounded-md border border-emerald-600 bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
                onClick={() => setConfirmType("approve")}
                disabled={pendingAction.borrowId === item.id}
              >
                <Check className="h-4 w-4" />
                Setujui
              </Button>
              <Button
                type="button"
                className="h-10 rounded-md border border-rose-600 bg-rose-600 px-4 text-white shadow-sm hover:bg-rose-700"
                onClick={() => setConfirmType("reject")}
                disabled={pendingAction.borrowId === item.id}
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
              disabled={pendingAction.borrowId === item.id}
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
              disabled={pendingAction.borrowId === item.id}
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
                disabled={pendingAction.borrowId === item.id}
              >
                <ShieldCheck className="h-4 w-4" />
                Finalisasi Return
              </Button>
              <Button
                type="button"
                className="h-10 rounded-md border border-amber-600 bg-amber-600 px-4 text-white shadow-sm hover:bg-amber-700"
                onClick={() => setInspectionAction("mark_damaged")}
                disabled={pendingAction.borrowId === item.id}
              >
                <TriangleAlert className="h-4 w-4" />
                Tandai Rusak
              </Button>
              <Button
                type="button"
                className="h-10 rounded-md border border-rose-600 bg-rose-600 px-4 text-white shadow-sm hover:bg-rose-700"
                onClick={() => setInspectionAction("mark_lost")}
                disabled={pendingAction.borrowId === item.id}
              >
                <X className="h-4 w-4" />
                Tandai Hilang
              </Button>
            </>
          ) : null}
          <Button type="button" variant="outline" onClick={() => navigate(backHref)}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-1 flex items-center gap-2">
          {normalizeStatus(item.status) === "expired" ? (
            <Hourglass className="h-4 w-4 text-slate-600" />
          ) : (
            <ClipboardList className="h-4 w-4 text-slate-600" />
          )}
          <h3 className="text-sm font-semibold text-slate-900">Progress Pengajuan</h3>
        </div>
        <BorrowFlow steps={flowSteps} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Informasi Utama</h3>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500">Alat</dt>
              <dd className="mt-1 text-sm text-slate-800">{item.equipmentName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Jumlah</dt>
              <dd className="mt-1 text-sm text-slate-800">{item.quantity}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Pemohon</dt>
              <dd className="mt-1 text-sm text-slate-800">{item.requesterName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Disetujui Oleh</dt>
              <dd className="mt-1 text-sm text-slate-800">{item.approvedByName || "-"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Waktu Peminjaman</h3>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500">Waktu Mulai</dt>
              <dd className="mt-1 text-sm text-slate-800">{formatDateTimeWib(item.startTime)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Waktu Selesai</dt>
              <dd className="mt-1 text-sm text-slate-800">{formatDateTimeWib(item.endTime)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Pengembalian Aktual</dt>
              <dd className="mt-1 text-sm text-slate-800">{formatDateTimeWib(item.endTimeActual)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Diupdate</dt>
              <dd className="mt-1 text-sm text-slate-800">{formatDateTimeWib(item.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Keterangan Pengajuan</h3>
          </div>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium text-slate-500">Tujuan</dt>
              <dd className="mt-1 text-sm text-slate-800">{item.purpose}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Catatan Pemohon</dt>
              <dd className="mt-1 text-sm text-slate-800">{item.note || "-"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Hasil Inspeksi</h3>
          </div>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium text-slate-500">Status Akhir</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {item.status === "Lost/Damaged"
                  ? "Hilang/Rusak"
                  : getStatusDisplayLabel(item.status)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Catatan Inspeksi</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {item.inspectionNote || "-"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <StatusConfirmDialog
        open={Boolean(confirmType)}
        actionType={confirmType === "reject" ? "reject" : confirmType ? "approve" : null}
        onOpenChange={(open) => {
          if (!open) setConfirmType(null);
        }}
        onConfirm={handleBorrowAction}
        isSubmitting={pendingAction.borrowId === item.id}
        subjectLabel={
          confirmType === "handover"
            ? "serah-terima alat ini"
            : confirmType === "receive_return"
              ? "penerimaan pengembalian alat ini"
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
          pendingAction.borrowId === item.id &&
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
              Isi catatan inspeksi laboran sebelum menyimpan hasil akhir pengembalian.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">Catatan Inspeksi</label>
            <Textarea
              value={inspectionNote}
              onChange={(event) => setInspectionNote(event.target.value)}
              placeholder="Jelaskan hasil inspeksi, kerusakan, atau kehilangan alat"
              className="min-h-28 border-slate-300 bg-white"
              disabled={pendingAction.borrowId === item.id}
            />
          </div>

          <AlertDialogFooter className="border-t border-slate-200 pt-4">
            <AlertDialogCancel disabled={pendingAction.borrowId === item.id}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pendingAction.borrowId === item.id || !inspectionNote.trim()}
              onClick={() => void handleInspectionSubmit()}
              className={
                inspectionAction === "mark_damaged"
                  ? "rounded-md bg-amber-600 text-white hover:bg-amber-700"
                  : "rounded-md bg-rose-600 text-white hover:bg-rose-700"
              }
            >
              {pendingAction.borrowId === item.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : inspectionAction === "mark_damaged" ? (
                "Simpan Sebagai Rusak"
              ) : (
                "Simpan Sebagai Hilang"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
