"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Eye,
  Handshake,
  Hourglass,
  Loader2,
  Package,
  RotateCcw,
  Truck,
  Undo2,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import StatusConfirmDialog from "@/components/dialogs/StatusConfirmDialog";
import { Button } from "@/components/ui/button";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";
import { useBorrows } from "@/hooks/borrows/use-borrows";
import { useUpdateBorrowStatus } from "@/hooks/borrows/use-update-borrow-status";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { toEndOfDay, toStartOfDay } from "@/lib/date";
import { formatDateTimeWib } from "@/lib/date-time";
import {
  getStatusBadgeClass,
  getStatusDisplayLabel,
  getStatusSummaryTone,
} from "@/lib/status";

const PAGE_SIZE = 10;

function isPendingStatus(status: string) {
  return status.toLowerCase() === "pending";
}

function isApprovedStatus(status: string) {
  return status.toLowerCase() === "approved";
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

export default function BorrowEquipmentListContent({
  scope,
  emptyMessage,
}: {
  scope: "my" | "all";
  emptyMessage: string;
}) {
  const navigate = useNavigate();
  const { profile } = useLoadProfile();
  const [searchParams] = useSearchParams();
  const { updateBorrowStatus, pendingAction } = useUpdateBorrowStatus();
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmState, setConfirmState] = useState<{
    borrowId: string | number;
    type: "approve" | "reject" | "handover";
  } | null>(null);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("q") ?? "";
  const createdAfter = searchParams.get("created_after") ?? "";
  const createdBefore = searchParams.get("created_before") ?? "";

  useEffect(() => {
    setPage(1);
  }, [status, search, createdAfter, createdBefore]);

  const { borrows, totalCount, aggregates, isLoading, hasLoadedOnce, error } =
    useBorrows(
      page,
      PAGE_SIZE,
      {
        status,
        requestedBy: scope === "my" ? String(profile.id ?? "") : "",
        createdAfter: createdAfter ? toStartOfDay(createdAfter) : "",
        createdBefore: createdBefore ? toEndOfDay(createdBefore) : "",
      },
      reloadKey,
    );

  const filteredBorrows = useMemo(
    () =>
      borrows.filter((item) => {
        if (!item.equipmentName || item.equipmentName === "-") return false;
        const query = search.trim().toLowerCase();
        if (!query) return true;
        const haystack = [
          item.code,
          item.equipmentName,
          item.requesterName,
          item.purpose,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      }),
    [borrows, search],
  );

  const normalizedRole = normalizeRoleValue(profile?.role);
  const canReviewBorrows =
    scope === "all" &&
    (normalizedRole === ROLE_VALUES.ADMIN ||
      normalizedRole === ROLE_VALUES.LECTURER ||
      normalizedRole === ROLE_VALUES.STAFF);
  const showRequesterColumn = scope === "all";

  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || filteredBorrows.length) / PAGE_SIZE),
  );

  const handleBorrowAction = async () => {
    if (!confirmState) return;

    const { borrowId, type } = confirmState;
    const result = await updateBorrowStatus(borrowId, type);

    if (result.ok) {
      toast.success(
        type === "approve"
          ? "Pengajuan peminjaman alat berhasil disetujui."
          : type === "reject"
            ? "Pengajuan peminjaman alat berhasil ditolak."
            : "Alat berhasil ditandai sudah diserahkan ke peminjam.",
      );
      setReloadKey((prev) => prev + 1);
      setConfirmState(null);
      return;
    }

    toast.error(result.message);
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-7">
        <SummaryCard
          label="Total Pengajuan"
          value={aggregates.total}
          icon={<Package className="h-4 w-4" />}
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
          label="Borrowed"
          value={aggregates.borrowed}
          icon={<Truck className="h-4 w-4" />}
          tone={getStatusSummaryTone("Borrowed")}
        />
        <SummaryCard
          label="Returned"
          value={aggregates.returned}
          icon={<Undo2 className="h-4 w-4" />}
          tone={getStatusSummaryTone("Returned")}
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
          icon={<Hourglass className="h-4 w-4" />}
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
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Jumlah</th>
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
                <td colSpan={showRequesterColumn ? 9 : 8} className="px-3 py-10 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data...
                  </div>
                </td>
              </tr>
            ) : filteredBorrows.length ? (
              filteredBorrows.map((item) => (
                <tr key={String(item.id)} className="border-b last:border-b-0">
                  <td className="px-3 py-2.5 font-medium whitespace-nowrap text-slate-800">
                    {item.code}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{item.equipmentName}</td>
                  {showRequesterColumn ? (
                    <td className="px-3 py-2.5 whitespace-nowrap">{item.requesterName}</td>
                  ) : null}
                  <td className="px-3 py-2.5 whitespace-nowrap">{item.quantity}</td>
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
                      {canReviewBorrows && isPendingStatus(item.status) ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 w-8 rounded-md border border-emerald-200 bg-emerald-50 p-0 text-emerald-700 shadow-none hover:bg-emerald-100"
                            onClick={() =>
                              setConfirmState({
                                borrowId: item.id,
                                type: "approve",
                              })
                            }
                            disabled={pendingAction.borrowId === item.id}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 w-8 rounded-md border border-rose-200 bg-rose-50 p-0 text-rose-700 shadow-none hover:bg-rose-100"
                            onClick={() =>
                              setConfirmState({
                                borrowId: item.id,
                                type: "reject",
                              })
                            }
                            disabled={pendingAction.borrowId === item.id}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : null}
                      {canReviewBorrows && isApprovedStatus(item.status) ? (
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 w-8 rounded-md border border-sky-200 bg-sky-50 p-0 text-sky-700 shadow-none hover:bg-sky-100"
                          onClick={() =>
                            setConfirmState({
                              borrowId: item.id,
                              type: "handover",
                            })
                          }
                          disabled={pendingAction.borrowId === item.id}
                        >
                          <Handshake className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-300 text-slate-700"
                        onClick={() =>
                          navigate(
                            scope === "all"
                              ? `/borrow-equipment/all/${item.id}`
                              : `/borrow-equipment/${item.id}`,
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
                <td colSpan={showRequesterColumn ? 9 : 8} className="px-3 py-10 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InventoryPagination
        page={page}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={setPage}
      />

      <StatusConfirmDialog
        open={Boolean(confirmState)}
        actionType={
          confirmState?.type === "reject"
            ? "reject"
            : confirmState?.type
              ? "approve"
              : null
        }
        onOpenChange={(open) => {
          if (!open) setConfirmState(null);
        }}
        onConfirm={handleBorrowAction}
        isSubmitting={pendingAction.borrowId === confirmState?.borrowId}
        subjectLabel={
          confirmState?.type === "handover"
            ? "serah-terima alat ini"
            : "pengajuan peminjaman alat ini"
        }
      />
    </section>
  );
}
