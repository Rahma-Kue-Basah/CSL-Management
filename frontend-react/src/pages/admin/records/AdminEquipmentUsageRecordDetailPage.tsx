import { useState } from "react";
import { ArrowLeft, Check, ClipboardList, Loader2, X } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUseDetail } from "@/hooks/uses/use-uses";
import { useUpdateUseStatus } from "@/hooks/uses/use-update-use-status";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import StatusConfirmDialog from "@/components/dialogs/StatusConfirmDialog";

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

export default function AdminEquipmentUsageRecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useLoadProfile();
  const { updateUseStatus, pendingAction } = useUpdateUseStatus();
  const [confirmType, setConfirmType] = useState<"approve" | "reject" | null>(
    null,
  );
  const backTo =
    typeof location.state?.from === "string"
      ? location.state.from
      : "/admin/records/equipment-usage";

  const { useItem: item, setUseItem, isLoading, error } = useUseDetail(id);

  const handleUseAction = async () => {
    if (!item || !confirmType) return;

    const type = confirmType;
    const result = await updateUseStatus(item.id, type);

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
        ? "Penggunaan alat berhasil disetujui."
        : "Penggunaan alat berhasil ditolak.",
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
      ) : !item ? (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
          Data record penggunaan alat tidak ditemukan.
        </div>
      ) : (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">Detail Penggunaan Alat</p>
                <p className="text-sm text-slate-500">{item.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.status === "Pending" ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    className="border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => setConfirmType("approve")}
                    disabled={pendingAction.useId === item.id}
                  >
                    {pendingAction.useId === item.id &&
                    pendingAction.type === "approve" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="border border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
                    onClick={() => setConfirmType("reject")}
                    disabled={pendingAction.useId === item.id}
                  >
                    {pendingAction.useId === item.id &&
                    pendingAction.type === "reject" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Reject
                  </Button>
                </>
              ) : null}
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(backTo)}>
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <DetailRow
              label="Alat"
              value={item.equipmentName}
              onView={
                item.equipmentId
                  ? () =>
                      navigate(`/admin/inventory/equipment/${item.equipmentId}`, {
                        state: { from: location.pathname },
                      })
                  : undefined
              }
            />
            <DetailRow label="Jumlah" value={item.quantity} />
            <DetailRow
              label="Pengguna"
              value={item.requesterName}
              onView={
                item.requesterId
                  ? () =>
                      navigate(`/admin/user-management/detail/${item.requesterId}`, {
                        state: { from: location.pathname },
                      })
                  : undefined
              }
            />
            <DetailRow label="Status" value={item.status} />
            <DetailRow label="Tujuan" value={item.purpose} />
            <DetailRow label="Waktu" value={formatDateRange(item.startTime, item.endTime)} />
            <DetailRow label="Dibuat" value={formatDateTime(item.createdAt)} />
            <DetailRow label="Diupdate" value={formatDateTime(item.updatedAt)} />
            <DetailRow
              label="Disetujui Oleh"
              value={item.approvedByName}
              onView={
                item.approvedById
                  ? () =>
                      navigate(`/admin/user-management/detail/${item.approvedById}`, {
                        state: { from: location.pathname },
                      })
                  : undefined
              }
            />
            <DetailRow label="Catatan" value={item.note || "-"} />
          </div>
        </div>
      )}

      <StatusConfirmDialog
        open={Boolean(confirmType)}
        actionType={confirmType}
        onOpenChange={(open) => {
          if (!open) setConfirmType(null);
        }}
        onConfirm={handleUseAction}
        isSubmitting={Boolean(item) && pendingAction.useId === item?.id}
        subjectLabel="pengajuan penggunaan alat ini"
      />
    </section>
  );
}
