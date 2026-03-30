"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Hourglass,
  NotebookPen,
  Truck,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardDetailReviewPanel } from "@/components/dashboard/layout/DashboardDetailReviewPanel";
import { ProgressSteps } from "@/components/shared/progress-steps";
import { Skeleton } from "@/components/ui/skeleton";
import { useBorrowDetail } from "@/hooks/borrows/use-borrows";
import { formatDateTimeWib } from "@/lib/date-format";
import { getStatusBadgeClass, getStatusDisplayLabel } from "@/lib/status";

type BorrowFlowStep = {
  key: string;
  label: string;
  time?: string;
  state: "finish" | "process" | "wait" | "error";
};

function hasDisplayValue(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim();
  return normalized !== "" && normalized !== "-";
}

function normalizeStatus(value: string) {
  return value.toLowerCase();
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
    return baseSteps;
  }
  if (status === "approved") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = formatDateTimeWib(item.updatedAt);
    baseSteps[2].state = "process";
    return baseSteps;
  }
  if (status === "borrowed") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = formatDateTimeWib(item.updatedAt);
    baseSteps[2].state = "finish";
    baseSteps[2].time = formatDateTimeWib(item.updatedAt);
    baseSteps[3].state = "process";
    return baseSteps;
  }
  if (status === "returned") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = formatDateTimeWib(item.updatedAt);
    baseSteps[2].state = "finish";
    baseSteps[2].time = formatDateTimeWib(item.updatedAt);
    baseSteps[3].state = "finish";
    baseSteps[3].time = formatDateTimeWib(item.endTimeActual || item.updatedAt);
    baseSteps[4].state = "finish";
    baseSteps[4].time = formatDateTimeWib(item.updatedAt);
    baseSteps[5].state = "finish";
    baseSteps[5].time = formatDateTimeWib(item.updatedAt);
    return baseSteps;
  }
  if (
    status === "returned pending inspection" ||
    status === "returned_pending_inspection"
  ) {
    baseSteps[1].state = "finish";
    baseSteps[1].time = formatDateTimeWib(item.updatedAt);
    baseSteps[2].state = "finish";
    baseSteps[2].time = formatDateTimeWib(item.updatedAt);
    baseSteps[3].state = "finish";
    baseSteps[3].time = formatDateTimeWib(item.endTimeActual || item.updatedAt);
    baseSteps[4].state = "process";
    return baseSteps;
  }
  if (status === "rejected") {
    baseSteps[1] = {
      key: "rejected",
      label: "Ditolak",
      time: formatDateTimeWib(item.updatedAt),
      state: "error",
    };
    return baseSteps.slice(0, 2);
  }
  if (status === "expired") {
    baseSteps[1] = {
      key: "expired",
      label: "Expired",
      time: formatDateTimeWib(item.updatedAt),
      state: "error",
    };
    return baseSteps.slice(0, 2);
  }
  if (status === "overdue") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = formatDateTimeWib(item.updatedAt);
    baseSteps[2].state = "error";
    baseSteps[2].label = "Terlambat";
    baseSteps[2].time = formatDateTimeWib(item.updatedAt);
    return baseSteps.slice(0, 3);
  }
  if (status === "lost/damaged") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = formatDateTimeWib(item.updatedAt);
    baseSteps[2].state = "finish";
    baseSteps[2].time = formatDateTimeWib(item.updatedAt);
    baseSteps[3].state = "finish";
    baseSteps[3].time = formatDateTimeWib(item.endTimeActual || item.updatedAt);
    baseSteps[4] = {
      key: "lost-damaged",
      label: "Hilang/Rusak",
      time: formatDateTimeWib(item.updatedAt),
      state: "error",
    };
    return baseSteps.slice(0, 5);
  }

  return baseSteps;
}

function BorrowFlow({ steps }: { steps: BorrowFlowStep[] }) {
  return (
    <ProgressSteps steps={steps} minWidthClassName="min-w-[760px]" />
  );
}

function DetailCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function DetailMetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!hasDisplayValue(value)) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-right text-xs leading-5 text-slate-800">{value}</p>
    </div>
  );
}

function BorrowDetailSkeleton() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-44 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4">
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BorrowEquipmentDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [reloadKey, setReloadKey] = useState(0);
  const { borrow: item, isLoading, error } = useBorrowDetail(id, reloadKey);

  const isAllPage = location.pathname.startsWith("/borrow-equipment/approval/");
  const backHref = isAllPage ? "/borrow-equipment/approval" : "/borrow-equipment";
  const backLabel = isAllPage
    ? "Kembali ke Daftar Pengajuan"
    : "Kembali ke Pengajuan Saya";

  if (isLoading) {
    return <BorrowDetailSkeleton />;
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

      <div
        className={
          isAllPage
            ? "grid gap-4 xl:grid-cols-[1.35fr_0.65fr]"
            : "space-y-4"
        }
      >
        {isAllPage ? (
          <>
            <div className="space-y-4">
              <DetailCard
                title="Detail Peminjaman Alat"
                subtitle="Ringkasan data peminjaman alat yang diajukan oleh pemohon."
                icon={<Wrench className="h-4 w-4" />}
              >
                <DetailMetaItem label="Alat" value={item.equipmentName} />
                <DetailMetaItem label="Jumlah" value={item.quantity} />
                <DetailMetaItem
                  label="Waktu Mulai"
                  value={formatDateTimeWib(item.startTime)}
                />
                <DetailMetaItem
                  label="Waktu Selesai"
                  value={formatDateTimeWib(item.endTime)}
                />
                <DetailMetaItem label="Tujuan" value={item.purpose} />
                <DetailMetaItem label="Catatan Pemohon" value={item.note || "-"} />
              </DetailCard>

              <DetailCard
                title="Informasi Permohonan"
                subtitle="Informasi utama permohonan dan hasil persetujuan saat ini."
                icon={<CalendarClock className="h-4 w-4" />}
              >
                <DetailMetaItem label="Pemohon" value={item.requesterName} />
                <DetailMetaItem
                  label="Status Saat Ini"
                  value={getStatusDisplayLabel(item.status)}
                />
                <DetailMetaItem
                  label="Disetujui Oleh"
                  value={item.approvedByName || "-"}
                />
                <DetailMetaItem
                  label="Pengembalian Aktual"
                  value={formatDateTimeWib(item.endTimeActual)}
                />
              </DetailCard>
            </div>

            <div className="space-y-4">
              {id ? (
                <DashboardDetailReviewPanel
                  context={{ kind: "borrow", id }}
                  onActionComplete={() => setReloadKey((prev) => prev + 1)}
                />
              ) : null}

              {hasDisplayValue(item.inspectionNote) ||
              item.status === "Lost/Damaged" ? (
                <section className="rounded-xl border border-slate-200 bg-white p-5">
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
                    {hasDisplayValue(item.inspectionNote) ? (
                      <div>
                        <dt className="text-xs font-medium text-slate-500">Catatan Inspeksi</dt>
                        <dd className="mt-1 text-sm text-slate-800">
                          {item.inspectionNote}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </section>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <DetailCard
                  title="Detail Peminjaman Alat"
                  subtitle="Ringkasan data peminjaman alat yang diajukan oleh pemohon."
                  icon={<Wrench className="h-4 w-4" />}
                >
                  <DetailMetaItem label="Alat" value={item.equipmentName} />
                  <DetailMetaItem label="Jumlah" value={item.quantity} />
                  <DetailMetaItem
                    label="Waktu Mulai"
                    value={formatDateTimeWib(item.startTime)}
                  />
                  <DetailMetaItem
                    label="Waktu Selesai"
                    value={formatDateTimeWib(item.endTime)}
                  />
                  <DetailMetaItem label="Tujuan" value={item.purpose} />
                  <DetailMetaItem label="Catatan Pemohon" value={item.note || "-"} />
                </DetailCard>
              </div>

              <div className="space-y-4">
                <DetailCard
                  title="Informasi Permohonan"
                  subtitle="Informasi utama permohonan dan hasil persetujuan saat ini."
                  icon={<CalendarClock className="h-4 w-4" />}
                >
                  <DetailMetaItem label="Pemohon" value={item.requesterName} />
                  <DetailMetaItem
                    label="Status Saat Ini"
                    value={getStatusDisplayLabel(item.status)}
                  />
                  <DetailMetaItem
                    label="Disetujui Oleh"
                    value={item.approvedByName || "-"}
                  />
                  <DetailMetaItem
                    label="Pengembalian Aktual"
                    value={formatDateTimeWib(item.endTimeActual)}
                  />
                </DetailCard>

                {hasDisplayValue(item.inspectionNote) ||
                item.status === "Lost/Damaged" ? (
                  <section className="rounded-xl border border-slate-200 bg-white p-5">
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
                  </section>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
