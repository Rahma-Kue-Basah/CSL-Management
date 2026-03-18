import { useState } from "react";
import {
  CalendarClock,
  Check,
  ClipboardList,
  Loader2,
  NotebookPen,
  Wrench,
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
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { useUseDetail } from "@/hooks/uses/use-uses";
import { useUpdateUseStatus } from "@/hooks/uses/use-update-use-status";
import { formatDateTimeWib } from "@/lib/date-time";

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
      ) : !item ? (
        <div className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-muted-foreground">
          Data record penggunaan alat tidak ditemukan.
        </div>
      ) : (
        <AdminRecordDetailShell
          title="Detail Penggunaan Alat"
          code={item.code}
          icon={<ClipboardList className="h-5 w-5" />}
          status={item.status}
          onBack={() => navigate(backTo)}
          actions={
            item.status === "Pending" ? (
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
                  Setujui
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
                  Tolak
                </Button>
              </>
            ) : null
          }
          aside={
            <>
              <AdminRecordAsideCard title="Ringkasan Status">
                <AdminRecordAsideItem label="Status" value={item.status} />
                <AdminRecordAsideItem
                  label="Diajukan"
                  value={formatDateTimeWib(item.createdAt)}
                />
                <AdminRecordAsideItem
                  label="Diupdate"
                  value={formatDateTimeWib(item.updatedAt)}
                />
                <AdminRecordAsideItem
                  label="Disetujui Oleh"
                  value={item.approvedByName || "-"}
                />
              </AdminRecordAsideCard>
              <AdminRecordAsideCard title="Audit Singkat">
                <AdminRecordAsideItem label="Kode" value={item.code} />
                <AdminRecordAsideItem label="Alat" value={item.equipmentName} />
                <AdminRecordAsideItem
                  label="Pengguna"
                  value={item.requesterName}
                />
              </AdminRecordAsideCard>
            </>
          }
        >
          <AdminRecordDetailSection
            title="Informasi Utama"
            icon={<Wrench className="h-5 w-5" />}
          >
            <AdminRecordDetailGrid>
              <AdminRecordDetailItem
                label="Alat"
                value={item.equipmentName}
                hrefLabel={item.equipmentId ? "Lihat detail" : undefined}
                onClick={
                  item.equipmentId
                    ? () =>
                        navigate(`/admin/inventory/equipment/${item.equipmentId}`, {
                          state: { from: location.pathname },
                        })
                    : undefined
                }
              />
              <AdminRecordDetailItem label="Jumlah" value={item.quantity} />
              <AdminRecordDetailItem
                label="Pengguna"
                value={item.requesterName}
                hrefLabel={item.requesterId ? "Lihat user" : undefined}
                onClick={
                  item.requesterId
                    ? () =>
                        navigate(
                          `/admin/user-management/detail/${item.requesterId}`,
                          {
                            state: { from: location.pathname },
                          },
                        )
                    : undefined
                }
              />
              <AdminRecordDetailItem
                label="Status"
                value={item.status}
                status
              />
            </AdminRecordDetailGrid>
            <div className="mt-3">
              <AdminRecordDetailItem label="Tujuan" value={item.purpose} />
            </div>
          </AdminRecordDetailSection>

          <AdminRecordDetailSection
            title="Jadwal Penggunaan"
            icon={<CalendarClock className="h-5 w-5" />}
          >
            <AdminRecordDetailGrid>
              <AdminRecordDetailItem
                label="Waktu Mulai"
                value={formatDateTimeWib(item.startTime)}
              />
              <AdminRecordDetailItem
                label="Waktu Selesai"
                value={formatDateTimeWib(item.endTime)}
              />
            </AdminRecordDetailGrid>
          </AdminRecordDetailSection>

          <AdminRecordDetailSection
            title="Catatan dan Persetujuan"
            icon={<NotebookPen className="h-5 w-5" />}
          >
            <AdminRecordDetailGrid>
              <AdminRecordDetailItem
                label="Disetujui Oleh"
                value={item.approvedByName}
                hrefLabel={item.approvedById ? "Lihat user" : undefined}
                onClick={
                  item.approvedById
                    ? () =>
                        navigate(
                          `/admin/user-management/detail/${item.approvedById}`,
                          {
                            state: { from: location.pathname },
                          },
                        )
                    : undefined
                }
              />
              <AdminRecordDetailItem
                label="Catatan Pemohon"
                value={item.note || "-"}
              />
            </AdminRecordDetailGrid>
          </AdminRecordDetailSection>
        </AdminRecordDetailShell>
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
