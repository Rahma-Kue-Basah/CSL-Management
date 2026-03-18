"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import AdminRecordExportActions from "@/components/admin/records/AdminRecordExportActions";
import AdminRecordSummaryCards from "@/components/admin/records/AdminRecordSummaryCards";
import RecordDeleteDialog from "@/components/admin/records/RecordDeleteDialog";
import { InventoryFilterCard } from "@/components/admin/inventory/inventory-filter-card";
import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { API_BORROW_DETAIL, API_BORROWS_EXPORT } from "@/constants/api";
import { mapBorrow, useBorrows, type BorrowRow } from "@/hooks/borrows/use-borrows";
import { useDeleteRecord } from "@/hooks/use-delete-record";
import { formatDateKey, parseDateKey, toEndOfDay, toStartOfDay } from "@/lib/date";
import { BORROW_EXPORT_COLUMNS } from "@/lib/admin-record-export-config";
import {
  BORROW_STATUS_OPTIONS,
  getStatusBadgeClass,
  getStatusDisplayLabel,
} from "@/lib/status";
import { useAdminRecordExport } from "@/hooks/admin/use-admin-record-export";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = BORROW_STATUS_OPTIONS;

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

function matchesSearch(row: BorrowRow, query: string) {
  if (!query) return true;
  const haystack = [row.code, row.equipmentName, row.requesterName, row.purpose]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function AdminRecordPeminjamanAlatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<BorrowRow | null>(null);
  const { deleteRecord, isDeleting } = useDeleteRecord();
  const {
    exportPdf,
    exportExcel,
    isExportingPdf,
    isExportingExcel,
  } = useAdminRecordExport({
    endpoint: API_BORROWS_EXPORT,
    filters: {
      q: debouncedSearch,
      status,
      created_after: createdAfter ? toStartOfDay(createdAfter) : "",
      created_before: createdBefore ? toEndOfDay(createdBefore) : "",
    },
    mapItem: mapBorrow,
    title: "Record Peminjaman Alat",
    pdfFilename: "record-peminjaman-alat.pdf",
    excelFilename: "record-peminjaman-alat.xlsx",
    columns: BORROW_EXPORT_COLUMNS,
    emptyMessage: "Tidak ada data peminjaman alat untuk diunduh.",
    pdfSuccessMessage: "PDF peminjaman alat berhasil diunduh.",
    excelSuccessMessage: "Excel peminjaman alat berhasil diunduh.",
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const { borrows, totalCount, aggregates, isLoading, hasLoadedOnce, error } = useBorrows(
    page,
    PAGE_SIZE,
    {
      status,
      createdAfter: createdAfter ? toStartOfDay(createdAfter) : "",
      createdBefore: createdBefore ? toEndOfDay(createdBefore) : "",
    },
    reloadKey,
  );

  const filteredBorrows = useMemo(
    () => borrows.filter((item) => matchesSearch(item, debouncedSearch)),
    [borrows, debouncedSearch],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || filteredBorrows.length) / PAGE_SIZE)),
    [totalCount, filteredBorrows.length],
  );

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setCreatedAfter("");
    setCreatedBefore("");
    setPage(1);
    setFilterOpen(false);
    setReloadKey((prev) => prev + 1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteRecord(API_BORROW_DETAIL(deleteTarget.id));
    if (result.ok) {
      toast.success("Record peminjaman alat berhasil dihapus.");
      setDeleteTarget(null);
      setReloadKey((prev) => prev + 1);
      return;
    }
    toast.error(result.message);
  };

  return (
    <section className="w-full min-w-0 space-y-4 px-4 pb-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-4">
          <AdminPageHeader
            title="Record Peminjaman Alat"
            description="Pantau histori peminjaman alat laboratorium."
            icon={<Eye className="h-5 w-5 text-sky-200" />}
          />

          <AdminRecordSummaryCards
            items={[
              { label: "Total", value: aggregates.total, tone: "blue" },
              { label: "Pending", value: aggregates.pending },
              { label: "Approved", value: aggregates.approved },
              { label: "Rejected", value: aggregates.rejected },
              { label: "Borrowed", value: aggregates.borrowed, tone: "blue" },
              { label: "Returned", value: aggregates.returned },
              { label: "Overdue", value: aggregates.overdue },
              { label: "Lost/Damaged", value: aggregates.lost_damaged },
            ]}
          />

          <InventoryFilterCard
            open={filterOpen}
            onToggle={() => setFilterOpen((prev) => !prev)}
            onReset={resetFilters}
          >
            <form
              className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
              }}
            >
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Cari
                </label>
                <Input
                  type="search"
                  value={search}
                  placeholder="Kode, alat, atau peminjam"
                  className="border-slate-400 bg-white shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
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
                  className="h-9 w-full rounded-md border border-slate-400 bg-white px-2 text-sm outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
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
                  buttonClassName="h-9 w-full rounded-md border-slate-400 bg-white px-2 shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
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
                  buttonClassName="h-9 w-full rounded-md border-slate-400 bg-white px-2 shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                />
              </div>
            </form>
          </InventoryFilterCard>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Export mengikuti filter dan pencarian yang sedang aktif.
            </p>
            <AdminRecordExportActions
              onExportExcel={exportExcel}
              onExportPdf={exportPdf}
              isExportingExcel={isExportingExcel}
              isExportingPdf={isExportingPdf}
            />
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="w-full min-w-0 overflow-x-auto rounded border border-slate-200 bg-card [scrollbar-width:thin]">
            <table className="min-w-max w-full table-auto">
              <thead className="border-b border-slate-800 bg-slate-900">
                <tr className="text-left text-sm">
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Kode
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Alat
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Peminjam
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Waktu Mulai
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Waktu Selesai
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Status
                  </th>
                  <th className="sticky right-0 z-10 relative whitespace-nowrap bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading || !hasLoadedOnce ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : filteredBorrows.length ? (
                  filteredBorrows.map((item) => (
                    <tr key={String(item.id)} className="border-b last:border-b-0">
                      <td className="whitespace-nowrap px-3 py-2 font-medium">
                        {item.code}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{item.equipmentName}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {item.requesterName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {formatDateTime(item.startTime)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {formatDateTime(item.endTime)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(
                            item.status,
                          )}`}
                        >
                          {getStatusDisplayLabel(item.status)}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 relative bg-card px-3 py-2 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              navigate(`/admin/records/equipment-borrows/${item.id}`, {
                                state: { from: location.pathname },
                              });
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      Tidak ada data peminjaman alat.
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

          <RecordDeleteDialog
            open={Boolean(deleteTarget)}
            title="Hapus record peminjaman alat?"
            description={`Record ${deleteTarget?.code ?? ""} akan dihapus permanen.`}
            isDeleting={isDeleting}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            onConfirm={handleDelete}
          />
        </div>
      </div>
    </section>
  );
}
