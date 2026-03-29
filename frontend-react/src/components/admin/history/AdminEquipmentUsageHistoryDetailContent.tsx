"use client";

import type { ReactNode } from "react";
import {
  CalendarClock,
  ClipboardList,
  NotebookPen,
  Wrench,
} from "lucide-react";

import {
  AdminRecordAsideCard,
  AdminRecordAsideItem,
  AdminRecordDetailGrid,
  AdminRecordDetailItem,
  AdminRecordDetailSection,
  AdminRecordDetailShell,
} from "@/components/admin/history/AdminHistoryDetailLayout";
import type { UseRow } from "@/hooks/uses/use-uses";
import { formatDateTimeWib } from "@/lib/date-format";

type Props = {
  item: UseRow | null;
  isLoading: boolean;
  error: string;
  onBack: () => void;
  backLabel?: string;
  actions?: ReactNode;
  showAside?: boolean;
  onOpenEquipmentDetail?: (equipmentId: string | number) => void;
  onOpenUserDetail?: (userId: string | number) => void;
};

export default function AdminEquipmentUsageRecordDetailContent({
  item,
  isLoading,
  error,
  onBack,
  backLabel = "Kembali",
  actions,
  showAside = true,
  onOpenEquipmentDetail,
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
          onBack={onBack}
          backLabel={backLabel}
          actions={actions}
          aside={
            showAside
              ? (
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
                <AdminRecordAsideItem label="Pengguna" value={item.requesterName} />
              </AdminRecordAsideCard>
            </>
                )
              : undefined
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
                hrefIcon={Boolean(item.equipmentId)}
                onClick={
                  item.equipmentId && onOpenEquipmentDetail
                    ? () => onOpenEquipmentDetail(item.equipmentId)
                    : undefined
                }
              />
              <AdminRecordDetailItem label="Jumlah" value={item.quantity} />
              <AdminRecordDetailItem
                label="Pengguna"
                value={item.requesterName}
                hrefIcon={Boolean(item.requesterId)}
                onClick={
                  item.requesterId && onOpenUserDetail
                    ? () => onOpenUserDetail(item.requesterId)
                    : undefined
                }
              />
              <AdminRecordDetailItem label="Status" value={item.status} status />
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
                hrefIcon={Boolean(item.approvedById)}
                onClick={
                  item.approvedById && onOpenUserDetail
                    ? () => onOpenUserDetail(item.approvedById)
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
    </>
  );
}
