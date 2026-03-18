import {
  ClipboardList,
  FlaskConical,
  Microscope,
  UserRound,
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
import { usePengujianDetail } from "@/hooks/pengujians/use-pengujians";
import { formatDateTimeWib } from "@/lib/date-time";

export default function AdminSampleTestingRecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo =
    typeof location.state?.from === "string"
      ? location.state.from
      : "/admin/records/sample-testing";

  const { pengujian: item, isLoading, error } = usePengujianDetail(id);

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
          Data record pengujian sampel tidak ditemukan.
        </div>
      ) : (
        <AdminRecordDetailShell
          title="Detail Pengujian Sampel"
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
                <AdminRecordAsideItem label="Pemohon" value={item.name} />
                <AdminRecordAsideItem
                  label="Institusi"
                  value={item.institution}
                />
              </AdminRecordAsideCard>
            </>
          }
        >
          <AdminRecordDetailSection
            title="Informasi Pemohon"
            icon={<UserRound className="h-5 w-5" />}
          >
            <AdminRecordDetailGrid>
              <AdminRecordDetailItem label="Nama Pemohon" value={item.name} />
              <AdminRecordDetailItem label="Institusi" value={item.institution} />
              <AdminRecordDetailItem label="Email" value={item.email} />
              <AdminRecordDetailItem label="Telepon" value={item.phoneNumber} />
              <AdminRecordDetailItem
                label="Pemohon Internal"
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
            title="Detail Sampel"
            icon={<FlaskConical className="h-5 w-5" />}
          >
            <AdminRecordDetailGrid>
              <AdminRecordDetailItem label="Jenis Sampel" value={item.sampleType} />
              <AdminRecordDetailItem label="Bentuk Sampel" value={item.sampleShape} />
              <AdminRecordDetailItem
                label="Kondisi Sampel"
                value={item.sampleCondition}
              />
              <AdminRecordDetailItem
                label="Kemasan Sampel"
                value={item.samplePackaging}
              />
              <AdminRecordDetailItem label="Berat Sampel" value={item.sampleWeight} />
              <AdminRecordDetailItem
                label="Jumlah Sampel"
                value={item.sampleQuantity}
              />
            </AdminRecordDetailGrid>
          </AdminRecordDetailSection>

          <AdminRecordDetailSection
            title="Spesifikasi Pengujian"
            icon={<Microscope className="h-5 w-5" />}
          >
            <AdminRecordDetailGrid>
              <AdminRecordDetailItem
                label="Penyajian Sampel"
                value={item.sampleTestingServing}
              />
              <AdminRecordDetailItem
                label="Metode Pengujian"
                value={item.sampleTestingMethod}
              />
              <AdminRecordDetailItem
                label="Jenis Pengujian"
                value={item.sampleTestingType}
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
        </AdminRecordDetailShell>
      )}
    </section>
  );
}
