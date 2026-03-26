"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Eye,
  Loader2,
  Package,
  RotateCcw,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { DataPagination } from "@/components/shared/data-pagination";
import { Button } from "@/components/ui/button";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";
import StatusConfirmDialog from "@/components/dialogs/StatusConfirmDialog";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { useUpdateUseStatus } from "@/hooks/uses/use-update-use-status";
import { useUses } from "@/hooks/uses/use-uses";
import { formatDateTimeWib } from "@/lib/date-format";
import {
  getStatusBadgeClass,
  getStatusDisplayLabel,
  getStatusSummaryTone,
} from "@/lib/status";
import {
  toEndOfDay,
  toStartOfDay,
} from "@/lib/date";

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
        <div className={`rounded-lg p-2 ${toneClass.icon}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function UseEquipmentListContent({
  scope,
  emptyMessage,
}: {
  scope: "my" | "all";
  emptyMessage: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useLoadProfile();
  const { updateUseStatus, pendingAction } = useUpdateUseStatus();
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmState, setConfirmState] = useState<{
    useId: string | number;
    type: "approve" | "reject";
  } | null>(null);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("q") ?? "";
  const createdAfter = searchParams.get("created_after") ?? "";
  const createdBefore = searchParams.get("created_before") ?? "";

  useEffect(() => {
    setPage(1);
  }, [status, search, createdAfter, createdBefore]);

  const { uses, totalCount, aggregates, isLoading, hasLoadedOnce, error } = useUses(
    page,
    PAGE_SIZE,
    {
      status,
      requestedBy: scope === "my" ? String(profile?.id ?? "") : "",
      createdAfter: createdAfter ? toStartOfDay(createdAfter) : "",
      createdBefore: createdBefore ? toEndOfDay(createdBefore) : "",
    },
    reloadKey,
    scope,
  );

  const filteredUses = useMemo(() => {
    const query = search.trim().toLowerCase();
    const equipmentUses = uses.filter(
      (item) => item.equipmentName && item.equipmentName !== "-",
    );

    if (!query) return equipmentUses;
    return equipmentUses.filter((item) => {
      const haystack = [
        item.code,
        item.equipmentName,
        item.requesterName,
        item.purpose,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [uses, search]);

  const normalizedRole = normalizeRoleValue(profile?.role);
  const canReviewUses =
    scope === "all" &&
    (normalizedRole === ROLE_VALUES.ADMIN ||
      normalizedRole === ROLE_VALUES.LECTURER ||
      normalizedRole === ROLE_VALUES.STAFF);
  const showRequesterColumn = scope === "all";

  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || filteredUses.length) / PAGE_SIZE),
  );
  const pendingCount = aggregates.pending;
  const approvedCount = aggregates.approved;
  const completedCount = aggregates.completed;
  const rejectedCount = aggregates.rejected;
  const expiredCount = aggregates.expired;

  const handleUseAction = async () => {
    if (!confirmState) return;

    const { useId, type } = confirmState;
    const result = await updateUseStatus(useId, type);

    if (result.ok) {
      toast.success(
        type === "approve"
          ? "Pengajuan penggunaan alat berhasil disetujui."
          : "Pengajuan penggunaan alat berhasil ditolak.",
      );
      setReloadKey((prev) => prev + 1);
      setConfirmState(null);
      return;
    }

    toast.error(result.message);
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <SummaryCard
          label="Total Pengajuan"
          value={aggregates.total}
          icon={<Package className="h-4 w-4" />}
          tone={getStatusSummaryTone("total")}
        />
        <SummaryCard
          label="Pending"
          value={pendingCount}
          icon={<CalendarClock className="h-4 w-4" />}
          tone={getStatusSummaryTone("Pending")}
        />
        <SummaryCard
          label="Approved"
          value={approvedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone={getStatusSummaryTone("Approved")}
        />
        <SummaryCard
          label="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone={getStatusSummaryTone("Completed")}
        />
        <SummaryCard
          label="Rejected"
          value={rejectedCount}
          icon={<RotateCcw className="h-4 w-4" />}
          tone={getStatusSummaryTone("Rejected")}
        />
        <SummaryCard
          label="Expired"
          value={expiredCount}
          icon={<X className="h-4 w-4" />}
          tone={getStatusSummaryTone("Expired")}
        />
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1120px]">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr className="text-left text-sm">
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Kode</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Alat</th>
              {showRequesterColumn ? (
                <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Pemohon</th>
              ) : null}
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Waktu Mulai</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Waktu Selesai</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Tujuan</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Status</th>
              <th className="sticky right-0 z-20 bg-slate-900 px-3 py-3 text-center font-medium whitespace-nowrap text-slate-50 shadow-[-1px_0_0_0_rgba(51,65,85,1)]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading || !hasLoadedOnce ? (
              <tr>
                <td colSpan={showRequesterColumn ? 8 : 7} className="px-3 py-10 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data...
                  </div>
                </td>
              </tr>
            ) : filteredUses.length ? (
              filteredUses.map((item) => (
                <tr key={String(item.id)} className="border-b last:border-b-0">
                  <td className="px-3 py-2.5 font-medium whitespace-nowrap text-slate-800">
                    {item.code}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{item.equipmentName}</td>
                  {showRequesterColumn ? (
                    <td className="px-3 py-2.5 whitespace-nowrap">{item.requesterName}</td>
                  ) : null}
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    {formatDateTimeWib(item.startTime)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    {formatDateTimeWib(item.endTime)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{item.purpose}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(item.status)}`}
                    >
                      {getStatusDisplayLabel(item.status)}
                    </span>
                  </td>
                  <td className="sticky right-0 z-10 bg-white px-3 py-2.5 text-center shadow-[-1px_0_0_0_rgba(226,232,240,1)]">
                    <div className="flex items-center justify-center gap-2">
                      {canReviewUses && isPendingStatus(item.status) ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 w-8 rounded-md border border-emerald-200 bg-emerald-50 p-0 text-emerald-700 shadow-none hover:bg-emerald-100"
                            onClick={() =>
                              setConfirmState({
                                useId: item.id,
                                type: "approve",
                              })
                            }
                            disabled={pendingAction.useId === item.id}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 w-8 rounded-md border border-rose-200 bg-rose-50 p-0 text-rose-700 shadow-none hover:bg-rose-100"
                            onClick={() =>
                              setConfirmState({
                                useId: item.id,
                                type: "reject",
                              })
                            }
                            disabled={pendingAction.useId === item.id}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-300 text-slate-700"
                        onClick={() =>
                          router.push(
                            scope === "all"
                              ? `/use-equipment/all/${item.id}`
                              : `/use-equipment/${item.id}`,
                          )
                        }
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={showRequesterColumn ? 8 : 7} className="px-3 py-10 text-center text-slate-500">
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
        totalCount={totalCount || filteredUses.length}
        pageSize={PAGE_SIZE}
        itemLabel="penggunaan alat"
        isLoading={isLoading}
        onPageChange={setPage}
      />

      <StatusConfirmDialog
        open={Boolean(confirmState)}
        actionType={confirmState?.type ?? null}
        onOpenChange={(open) => {
          if (!open) setConfirmState(null);
        }}
        onConfirm={handleUseAction}
        isSubmitting={pendingAction.useId === confirmState?.useId}
        subjectLabel="pengajuan penggunaan alat ini"
      />
    </section>
  );
}
