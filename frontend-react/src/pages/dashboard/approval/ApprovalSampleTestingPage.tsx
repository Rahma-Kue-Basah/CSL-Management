"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CalendarClock, Check, CheckCircle2, Eye, FlaskConical, Loader2, PackageSearch, RotateCcw, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import StatusConfirmDialog from "@/components/dialogs/StatusConfirmDialog";
import SampleTestingDetailContent from "@/components/dashboard/sample-testing/SampleTestingDetailContent";
import { DataPagination } from "@/components/shared/data-pagination";
import InlineErrorAlert from "@/components/shared/inline-error-alert";
import { TableActionIconButton } from "@/components/shared/TableActionIconButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStatusBadgeClass, getStatusDisplayLabel, getStatusSummaryTone } from "@/lib/status";
import { formatDateTimeWib } from "@/lib/date-format";
import { usePengujians, type PengujianRow } from "@/hooks/pengujians/use-pengujians";
import { useUpdatePengujianStatus } from "@/hooks/pengujians/use-update-pengujian-status";
import { toEndOfDay, toStartOfDay } from "@/lib/date";

const PAGE_SIZE = 10;

function isPendingStatus(status: string) {
  return status.toLowerCase() === "pending";
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: "slate" | "blue" | "amber" | "emerald" | "sky" | "rose";
}) {
  const toneClass =
    tone === "blue"
      ? {
          card: "border-blue-300 bg-blue-100/90",
          icon: "bg-white/80 text-blue-800",
          value: "text-blue-900",
        }
      : tone === "amber"
        ? {
            card: "border-amber-300 bg-amber-100/90",
            icon: "bg-white/80 text-amber-800",
            value: "text-amber-900",
          }
        : tone === "emerald"
          ? {
              card: "border-emerald-300 bg-emerald-100/90",
              icon: "bg-white/80 text-emerald-800",
              value: "text-emerald-900",
            }
          : tone === "sky"
            ? {
                card: "border-sky-300 bg-sky-100/90",
                icon: "bg-white/80 text-sky-800",
                value: "text-sky-900",
              }
            : tone === "rose"
              ? {
                  card: "border-rose-300 bg-rose-100/90",
                  icon: "bg-white/80 text-rose-800",
                  value: "text-rose-900",
                }
              : {
                  card: "border-slate-300 bg-slate-100/90",
                  icon: "bg-white/80 text-slate-800",
                  value: "text-slate-900",
                };

  return (
    <div
      className={`rounded-xl border p-3 shadow-[0_4px_14px_rgba(15,23,42,0.08)] ${toneClass.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-h-14 flex-col justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className={`text-2xl font-semibold leading-none ${toneClass.value}`}>
            {value}
          </p>
        </div>
        <div className={`rounded-lg p-2 ${toneClass.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ApprovalSampleTestingPage() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [detailTarget, setDetailTarget] = useState<PengujianRow | null>(null);
  const [confirmState, setConfirmState] = useState<{
    pengujianId: string | number;
    type: "approve" | "reject";
  } | null>(null);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("q") ?? "";
  const requestedBy = searchParams.get("requested_by") ?? "";
  const createdAfter = searchParams.get("created_after") ?? "";
  const createdBefore = searchParams.get("created_before") ?? "";
  const isActiveFilter = status === "active";
  const emptyMessage = isActiveFilter
    ? "Tidak ada pengajuan aktif pengujian sampel yang menjadi tanggung jawab Anda."
    : "Belum ada pengajuan pengujian sampel yang perlu Anda proses.";

  useEffect(() => {
    setPage(1);
  }, [status, search, requestedBy, createdAfter, createdBefore]);

  const { pengujians, totalCount, aggregates, isLoading, hasLoadedOnce, error } =
    usePengujians(
      page,
      PAGE_SIZE,
      {
        q: search,
        status,
        requestedBy,
        createdAfter: createdAfter ? toStartOfDay(createdAfter) : "",
        createdBefore: createdBefore ? toEndOfDay(createdBefore) : "",
      },
      reloadKey,
      "all",
    );

  const { updatePengujianStatus, pendingAction } = useUpdatePengujianStatus();

  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || pengujians.length) / PAGE_SIZE),
  );

  const handleStatusAction = async () => {
    if (!confirmState) return;

    const result = await updatePengujianStatus(
      confirmState.pengujianId,
      confirmState.type,
    );

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(
      confirmState.type === "approve"
        ? "Pengajuan pengujian sampel berhasil disetujui."
        : "Pengajuan pengujian sampel berhasil ditolak.",
    );
    setConfirmState(null);
    setReloadKey((prev) => prev + 1);
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <SummaryCard
          label="Total Pengajuan"
          value={aggregates.total}
          icon={<PackageSearch className="h-4 w-4" />}
          tone={getStatusSummaryTone("total")}
        />
        <SummaryCard
          label="Pending"
          value={aggregates.pending}
          icon={<CalendarClock className="h-4 w-4" />}
          tone={getStatusSummaryTone("Pending")}
        />
        <SummaryCard
          label="Approved"
          value={aggregates.approved}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone={getStatusSummaryTone("Approved")}
        />
        <SummaryCard
          label="Completed"
          value={aggregates.completed}
          icon={<FlaskConical className="h-4 w-4" />}
          tone={getStatusSummaryTone("Completed")}
        />
        <SummaryCard
          label="Rejected"
          value={aggregates.rejected}
          icon={<RotateCcw className="h-4 w-4" />}
          tone={getStatusSummaryTone("Rejected")}
        />
        <SummaryCard
          label="Expired"
          value={aggregates.expired}
          icon={<X className="h-4 w-4" />}
          tone={getStatusSummaryTone("Expired")}
        />
      </div>

      {error ? <InlineErrorAlert>{error}</InlineErrorAlert> : null}

      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1120px]">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr className="text-left text-sm">
              <th className="sticky left-0 z-20 bg-slate-900 px-3 py-3 text-center font-medium whitespace-nowrap text-slate-50 shadow-[1px_0_0_0_rgba(51,65,85,1)]">
                Aksi
              </th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Kode</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Pemohon</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Institusi</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Sampel</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Jenis Uji</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Status</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Dibuat</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading || !hasLoadedOnce ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data...
                  </div>
                </td>
              </tr>
            ) : pengujians.length ? (
              pengujians.map((item) => (
                <tr key={String(item.id)} className="border-b last:border-b-0">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2.5 text-center shadow-[1px_0_0_0_rgba(226,232,240,1)]">
                    <div className="flex items-center justify-center gap-2">
                      {isPendingStatus(item.status) ? (
                        <>
                          <TableActionIconButton
                            type="button"
                            label="Approve"
                            icon={<Check className="h-3.5 w-3.5" />}
                            className="w-8 rounded-md border border-emerald-200 bg-emerald-50 p-0 text-emerald-700 shadow-none hover:bg-emerald-100"
                            onClick={() =>
                              setConfirmState({
                                pengujianId: item.id,
                                type: "approve",
                              })
                            }
                            disabled={pendingAction.pengujianId === item.id}
                          />
                          <TableActionIconButton
                            type="button"
                            label="Reject"
                            icon={<X className="h-3.5 w-3.5" />}
                            className="w-8 rounded-md border border-rose-200 bg-rose-50 p-0 text-rose-700 shadow-none hover:bg-rose-100"
                            onClick={() =>
                              setConfirmState({
                                pengujianId: item.id,
                                type: "reject",
                              })
                            }
                            disabled={pendingAction.pengujianId === item.id}
                          />
                        </>
                      ) : null}
                      <TableActionIconButton
                        type="button"
                        label="Lihat detail"
                        icon={<Eye className="h-3.5 w-3.5" />}
                        className="w-8 rounded-md border border-slate-200 bg-slate-50 p-0 text-slate-700 shadow-none hover:bg-slate-100"
                        onClick={() => setDetailTarget(item)}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-medium whitespace-nowrap text-slate-800">
                    {item.code}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="whitespace-nowrap text-slate-500">{item.email}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{item.institution}</td>
                  <td className="px-3 py-2.5 text-slate-700">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-800">{item.sampleName}</p>
                      <p className="whitespace-nowrap text-slate-500">{item.sampleType}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{item.sampleTestingType}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(item.status)}`}
                    >
                      {getStatusDisplayLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    {formatDateTimeWib(item.createdAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DataPagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount || pengujians.length}
        pageSize={PAGE_SIZE}
        itemLabel="pengajuan"
        isLoading={isLoading}
        onPageChange={setPage}
      />

      <Dialog open={Boolean(detailTarget)} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[85vh] overflow-y-auto border-none bg-transparent p-0 shadow-none sm:max-w-6xl"
        >
          <DialogHeader>
            <DialogTitle className="sr-only">Detail Pengajuan Pengujian Sampel</DialogTitle>
          </DialogHeader>

          {detailTarget ? <SampleTestingDetailContent item={detailTarget} /> : null}
        </DialogContent>
      </Dialog>

      <StatusConfirmDialog
        open={Boolean(confirmState)}
        actionType={confirmState?.type ?? null}
        onOpenChange={(open) => !open && setConfirmState(null)}
        onConfirm={handleStatusAction}
        isSubmitting={Boolean(confirmState) && pendingAction.pengujianId === confirmState?.pengujianId}
        subjectLabel="pengajuan pengujian sampel ini"
      />
    </section>
  );
}
