import { ArrowLeft, ClipboardList } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { usePengujianDetail } from "@/hooks/pengujians/use-pengujians";

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

export default function AdminSampleTestingRecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo =
    typeof location.state?.from === "string"
      ? location.state.from
      : "/admin/record/pengujian-sampel";

  const { pengujian: item, isLoading, error } = usePengujianDetail(id);

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
          Data record pengujian sampel tidak ditemukan.
        </div>
      ) : (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">Detail Pengujian Sampel</p>
                <p className="text-sm text-slate-500">{item.code}</p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(backTo)}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <DetailRow label="Nama Pemohon" value={item.name} />
            <DetailRow label="Institusi" value={item.institution} />
            <DetailRow label="Email" value={item.email} />
            <DetailRow label="Telepon" value={item.phoneNumber} />
            <DetailRow label="Jenis Sampel" value={item.sampleType} />
            <DetailRow label="Bentuk Sampel" value={item.sampleShape} />
            <DetailRow label="Kondisi Sampel" value={item.sampleCondition} />
            <DetailRow label="Kemasan Sampel" value={item.samplePackaging} />
            <DetailRow label="Berat Sampel" value={item.sampleWeight} />
            <DetailRow label="Jumlah Sampel" value={item.sampleQuantity} />
            <DetailRow label="Penyajian Sampel" value={item.sampleTestingServing} />
            <DetailRow label="Metode Pengujian" value={item.sampleTestingMethod} />
            <DetailRow label="Jenis Pengujian" value={item.sampleTestingType} />
            <DetailRow label="Status" value={item.status} />
            <DetailRow label="Dibuat" value={formatDateTime(item.createdAt)} />
            <DetailRow label="Diupdate" value={formatDateTime(item.updatedAt)} />
            <DetailRow
              label="Pemohon Internal"
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
          </div>
        </div>
      )}
    </section>
  );
}
