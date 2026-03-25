import {
  CalendarClock,
  ClipboardList,
  NotebookPen,
  Wrench,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  AdminRecordDetailGrid,
  AdminRecordDetailItem,
  AdminRecordDetailSection,
  AdminRecordDetailShell,
} from "@/components/admin/records/AdminRecordDetailLayout";
import { useBorrowDetail } from "@/hooks/borrows/use-borrows";
import { formatDateTimeWib } from "@/lib/date-time";

export default function AdminEquipmentBorrowRecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo =
    typeof location.state?.from === "string"
      ? location.state.from
      : "/admin/records/equipment-borrows";

  const { borrow: item, isLoading, error } = useBorrowDetail(id);

  return (
    <section className="mx-auto w-full max-w-3xl min-w-0 space-y-4 px-4 pb-6">
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
          Data record peminjaman alat tidak ditemukan.
        </div>
      ) : (
        <AdminRecordDetailShell
          title="Detail Peminjaman Alat"
          code={item.code}
          icon={<ClipboardList className="h-5 w-5" />}
          status={item.status}
          compact
          onBack={() => navigate(backTo)}
        >
          <AdminRecordDetailSection
            title="Informasi Utama"
            icon={<Wrench className="h-5 w-5" />}
            compact
          >
            <AdminRecordDetailGrid compact>
              <AdminRecordDetailItem
                label="Alat"
                value={item.equipmentName}
                compact
                borderless
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
              <AdminRecordDetailItem label="Jumlah" value={item.quantity} compact borderless />
              <AdminRecordDetailItem
                label="Peminjam"
                value={item.requesterName}
                compact
                borderless
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
                compact
                borderless
              />
            </AdminRecordDetailGrid>
          </AdminRecordDetailSection>

          <AdminRecordDetailSection
            title="Waktu Peminjaman"
            icon={<CalendarClock className="h-5 w-5" />}
            compact
          >
            <AdminRecordDetailGrid compact>
              <AdminRecordDetailItem
                label="Waktu Mulai"
                value={formatDateTimeWib(item.startTime)}
                compact
                borderless
              />
              <AdminRecordDetailItem
                label="Waktu Selesai"
                value={formatDateTimeWib(item.endTime)}
                compact
                borderless
              />
              <AdminRecordDetailItem
                label="Pengembalian Aktual"
                value={formatDateTimeWib(item.endTimeActual)}
                compact
                borderless
              />
              <AdminRecordDetailItem
                label="Disetujui Oleh"
                value={item.approvedByName}
                compact
                borderless
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
            </AdminRecordDetailGrid>
          </AdminRecordDetailSection>

          <AdminRecordDetailSection
            title="Keterangan"
            icon={<NotebookPen className="h-5 w-5" />}
            compact
          >
            <div className="space-y-2.5">
              <AdminRecordDetailItem label="Tujuan" value={item.purpose} compact borderless />
              <AdminRecordDetailItem
                label="Catatan Pemohon"
                value={item.note || "-"}
                compact
                borderless
              />
              <AdminRecordDetailItem
                label="Catatan Inspeksi"
                value={item.inspectionNote || "-"}
                compact
                borderless
              />
            </div>
          </AdminRecordDetailSection>
        </AdminRecordDetailShell>
      )}
    </section>
  );
}
