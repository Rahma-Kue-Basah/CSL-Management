"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Eye,
  Filter,
  Loader2,
  Package,
  RotateCcw,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";
import BookingStatusConfirmDialog from "@/pages/dashboard/booking-rooms/BookingStatusConfirmDialog";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { useUpdateUseStatus } from "@/hooks/uses/use-update-use-status";
import { useUses } from "@/hooks/uses/use-uses";
import { formatDateTimeWib } from "@/lib/date-time";
import {
  formatDateKey,
  parseDateKey,
  toEndOfDay,
  toStartOfDay,
} from "@/lib/date";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "in_use", label: "In Use" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    case "in_use":
      return "bg-indigo-100 text-indigo-700";
    case "completed":
      return "bg-sky-100 text-sky-700";
    case "cancelled":
      return "bg-slate-200 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

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
  tone: "blue" | "amber" | "emerald" | "violet" | "rose";
}) {
  const toneClass =
    tone === "blue"
      ? {
          card: "border-blue-200/80 bg-blue-50/70",
          icon: "bg-blue-100 text-blue-700",
          value: "text-blue-900",
        }
      : tone === "amber"
        ? {
            card: "border-amber-200/80 bg-amber-50/70",
            icon: "bg-amber-100 text-amber-700",
            value: "text-amber-900",
          }
        : tone === "emerald"
          ? {
              card: "border-emerald-200/80 bg-emerald-50/70",
              icon: "bg-emerald-100 text-emerald-700",
              value: "text-emerald-900",
            }
          : tone === "violet"
            ? {
                card: "border-violet-200/80 bg-violet-50/70",
                icon: "bg-violet-100 text-violet-700",
                value: "text-violet-900",
              }
            : {
                card: "border-rose-200/80 bg-rose-50/70",
                icon: "bg-rose-100 text-rose-700",
                value: "text-rose-900",
              };

  return (
    <div
      className={`rounded-xl border p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${toneClass.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className={`mt-1 text-2xl font-semibold ${toneClass.value}`}>
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
  const { profile } = useLoadProfile();
  const { updateUseStatus, pendingAction } = useUpdateUseStatus();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmState, setConfirmState] = useState<{
    useId: string | number;
    type: "approve" | "reject";
  } | null>(null);

  const { uses, totalCount, isLoading, hasLoadedOnce, error } = useUses(
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
  const { uses: summarySourceUses, totalCount: summaryTotalCount } = useUses(
    1,
    1000,
    { requestedBy: scope === "my" ? String(profile?.id ?? "") : "" },
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

  const summaryUses = useMemo(
    () =>
      summarySourceUses.filter(
        (item) => item.equipmentName && item.equipmentName !== "-",
      ),
    [summarySourceUses],
  );
  const normalizedRole = normalizeRoleValue(profile?.role);
  const canReviewUses =
    scope === "all" &&
    (normalizedRole === ROLE_VALUES.ADMIN ||
      normalizedRole === ROLE_VALUES.LECTURER ||
      normalizedRole === ROLE_VALUES.STAFF);

  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || filteredUses.length) / PAGE_SIZE),
  );
  const pendingCount = summaryUses.filter(
    (item) => item.status.toLowerCase() === "pending",
  ).length;
  const approvedCount = summaryUses.filter(
    (item) => item.status.toLowerCase() === "approved",
  ).length;
  const completedCount = summaryUses.filter(
    (item) => item.status.toLowerCase() === "completed",
  ).length;
  const rejectedCount = summaryUses.filter(
    (item) => item.status.toLowerCase() === "rejected",
  ).length;

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setCreatedAfter("");
    setCreatedBefore("");
    setPage(1);
    setFilterOpen(false);
  };

  const handleUseAction = async () => {
    if (!confirmState) return;

    const { useId, type } = confirmState;
    const result = await updateUseStatus(useId, type);

    if (result.ok) {
      toast.success(
        type === "approve"
          ? "Pengajuan booking alat berhasil disetujui."
          : "Pengajuan booking alat berhasil ditolak.",
      );
      setReloadKey((prev) => prev + 1);
      setConfirmState(null);
      return;
    }

    toast.error(result.message);
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Total Pengajuan"
          value={summaryTotalCount || summaryUses.length}
          icon={<Package className="h-4 w-4" />}
          tone="blue"
        />
        <SummaryCard
          label="Pending"
          value={pendingCount}
          icon={<CalendarClock className="h-4 w-4" />}
          tone="amber"
        />
        <SummaryCard
          label="Approved"
          value={approvedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="emerald"
        />
        <SummaryCard
          label="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="violet"
        />
        <SummaryCard
          label="Rejected"
          value={rejectedCount}
          icon={<RotateCcw className="h-4 w-4" />}
          tone="rose"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/80">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-slate-800"
            onClick={() => setFilterOpen((prev) => !prev)}
          >
            <span className="rounded-md bg-white p-1.5 text-slate-600 shadow-xs">
              <Filter className="h-4 w-4" />
            </span>
            Filter Pengajuan
          </button>
          {filterOpen ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={resetFilters}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          ) : null}
        </div>

        {filterOpen ? (
          <div className="border-t border-slate-200/80 bg-white px-4 pb-4 pt-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Cari
                </label>
                <Input
                  type="search"
                  value={search}
                  placeholder="Kode, alat"
                  className="h-11 border-slate-300 bg-white px-3 shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Dibuat Dari
                </label>
                <DatePicker
                  value={parseDateKey(createdAfter)}
                  onChange={(value) => {
                    setCreatedAfter(value ? formatDateKey(value) : "");
                    setPage(1);
                  }}
                  clearable
                  buttonClassName="h-11 border-slate-300 px-3 shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Dibuat Sampai
                </label>
                <DatePicker
                  value={parseDateKey(createdBefore)}
                  onChange={(value) => {
                    setCreatedBefore(value ? formatDateKey(value) : "");
                    setPage(1);
                  }}
                  clearable
                  buttonClassName="h-11 border-slate-300 px-3 shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                />
              </div>
            </div>
          </div>
        ) : null}
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
              <th className="px-3 py-3 font-medium whitespace-nowrap text-slate-50">Pemohon</th>
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
                <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
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
                  <td className="px-3 py-2.5 whitespace-nowrap">{item.requesterName}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    {formatDateTimeWib(item.startTime)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    {formatDateTimeWib(item.endTime)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{item.purpose}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(item.status)}`}
                    >
                      {item.status}
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
                <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
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

      <BookingStatusConfirmDialog
        open={Boolean(confirmState)}
        actionType={confirmState?.type ?? null}
        onOpenChange={(open) => {
          if (!open) setConfirmState(null);
        }}
        onConfirm={handleUseAction}
        isSubmitting={pendingAction.useId === confirmState?.useId}
      />
    </section>
  );
}
