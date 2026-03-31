"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  FlaskConical,
  Loader2,
  PackageSearch,
  RotateCcw,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import { DataPagination } from "@/components/shared/data-pagination";
import InlineErrorAlert from "@/components/shared/inline-error-alert";
import { RequestProgressDialog } from "@/components/shared/request-progress-dialog";
import type { ProgressStepItem } from "@/components/shared/progress-steps";
import { TableActionIconButton } from "@/components/shared/TableActionIconButton";
import SampleTestingDetailContent from "@/components/dashboard/sample-testing/SampleTestingDetailContent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTimeWib } from "@/lib/date-format";
import { getPengujianProgressFlow } from "@/lib/request-progress";
import {
  getStatusBadgeClass,
  getStatusDisplayLabel,
  getStatusSummaryTone,
} from "@/lib/status";
import { toEndOfDay, toStartOfDay } from "@/lib/date";
import {
  usePengujians,
  type PengujianListScope,
  type PengujianRow,
} from "@/hooks/pengujians/use-pengujians";

const PAGE_SIZE = 10;

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
        <div className={`rounded-lg p-2 ${toneClass.icon}`}>{icon}</div>
      </div>
    </div>
  );
}

type SampleTestingListContentProps = {
  scope: PengujianListScope;
  emptyMessage: string;
};

export default function SampleTestingListContent({
  scope,
  emptyMessage,
}: SampleTestingListContentProps) {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [detailTarget, setDetailTarget] = useState<PengujianRow | null>(null);
  const [progressState, setProgressState] = useState<{
    code: string;
    steps: ProgressStepItem[];
  } | null>(null);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("q") ?? "";
  const createdAfter = searchParams.get("created_after") ?? "";
  const createdBefore = searchParams.get("created_before") ?? "";

  useEffect(() => {
    setPage(1);
  }, [status, search, createdAfter, createdBefore]);

  const { pengujians, totalCount, aggregates, isLoading, hasLoadedOnce, error } =
    usePengujians(
      page,
      PAGE_SIZE,
      {
        q: search,
        status,
        createdAfter: createdAfter ? toStartOfDay(createdAfter) : "",
        createdBefore: createdBefore ? toEndOfDay(createdBefore) : "",
      },
      0,
      scope,
    );

  const filteredPengujians = useMemo(() => pengujians, [pengujians]);

  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || filteredPengujians.length) / PAGE_SIZE),
  );

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
        <table className="w-full min-w-[1100px]">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr className="text-left text-sm">
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">
                Kode
              </th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">
                Sampel
              </th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">
                Jenis Uji
              </th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">
                Institusi
              </th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">
                Status
              </th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">
                Dibuat
              </th>
              <th className="sticky right-0 z-20 bg-slate-900 px-3 py-3 text-center font-medium whitespace-nowrap text-slate-50 shadow-[-1px_0_0_0_rgba(51,65,85,1)]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading || !hasLoadedOnce ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data...
                  </div>
                </td>
              </tr>
            ) : filteredPengujians.length ? (
              filteredPengujians.map((item) => (
                <tr key={String(item.id)} className="border-b last:border-b-0">
                  <td className="px-3 py-2.5 font-medium whitespace-nowrap text-slate-800">
                    {item.code}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-800">{item.sampleName}</p>
                      <p className="whitespace-nowrap text-slate-500">{item.sampleType}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    {item.sampleTestingType}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-800">{item.institution}</p>
                      <p className="whitespace-nowrap text-slate-500">{item.email}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setProgressState({
                          code: item.code,
                          steps: getPengujianProgressFlow(item),
                        })
                      }
                      className={`inline-flex cursor-pointer rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(item.status)}`}
                    >
                      {getStatusDisplayLabel(item.status)}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    {formatDateTimeWib(item.createdAt)}
                  </td>
                  <td className="sticky right-0 z-10 bg-white px-3 py-2.5 text-center shadow-[-1px_0_0_0_rgba(226,232,240,1)]">
                    <div className="flex items-center justify-center gap-2">
                      <TableActionIconButton
                        type="button"
                        label="Lihat detail"
                        icon={<Eye className="h-3.5 w-3.5" />}
                        className="w-8 rounded-md border border-slate-200 bg-slate-50 p-0 text-slate-700 shadow-none hover:bg-slate-100"
                        onClick={() => setDetailTarget(item)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
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
        totalCount={totalCount || filteredPengujians.length}
        pageSize={PAGE_SIZE}
        itemLabel="pengajuan"
        isLoading={isLoading}
        onPageChange={setPage}
      />

      <Dialog
        open={Boolean(detailTarget)}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[85vh] overflow-y-auto border-none bg-transparent p-0 shadow-none sm:max-w-6xl"
        >
          <DialogHeader>
            <DialogTitle className="sr-only">
              Detail Pengajuan Pengujian Sampel
            </DialogTitle>
          </DialogHeader>

          {detailTarget ? <SampleTestingDetailContent item={detailTarget} /> : null}
        </DialogContent>
      </Dialog>
      <RequestProgressDialog
        open={Boolean(progressState)}
        onOpenChange={(open) => {
          if (!open) setProgressState(null);
        }}
        title="Progress Pengujian Sampel"
        code={progressState?.code ?? ""}
        steps={progressState?.steps ?? []}
      />
    </section>
  );
}
