import {
  CalendarClock,
  ClipboardList,
  NotebookPen,
  Wrench,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  AdminRecordAsideCard,
  AdminRecordAsideItem,
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
          Data record peminjaman alat tidak ditemukan.
        </div>
      ) : (
        <AdminRecordDetailShell
          title="Detail Peminjaman Alat"
          code={item.code}
          icon={<ClipboardList className="h-5 w-5" />}
          status={item.status}
          onBack={() => navigate(backTo)}
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
                  label="Peminjam"
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
                label="Peminjam"
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
          </AdminRecordDetailSection>

          <AdminRecordDetailSection
            title="Waktu Peminjaman"
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
              <AdminRecordDetailItem
                label="Pengembalian Aktual"
                value={formatDateTimeWib(item.endTimeActual)}
              />
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
            </AdminRecordDetailGrid>
          </AdminRecordDetailSection>

          <AdminRecordDetailSection
            title="Keterangan"
            icon={<NotebookPen className="h-5 w-5" />}
          >
            <div className="space-y-3">
              <AdminRecordDetailItem label="Tujuan" value={item.purpose} />
              <AdminRecordDetailItem
                label="Catatan Pemohon"
                value={item.note || "-"}
              />
            </div>
          </AdminRecordDetailSection>
        </AdminRecordDetailShell>
      )}
    </section>
  );
}
