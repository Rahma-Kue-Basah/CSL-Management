"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Download, Eye, FileSpreadsheet, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import AdminEquipmentBorrowRecordDetailContent from "@/components/admin/records/AdminEquipmentBorrowRecordDetailContent";
import AdminRecordExportActions from "@/components/admin/records/AdminRecordExportActions";
import AdminRecordSummaryCards from "@/components/admin/records/AdminRecordSummaryCards";
import RecordDeleteDialog from "@/components/admin/records/RecordDeleteDialog";
import { InventoryFilterCard } from "@/components/admin/inventory/inventory-filter-card";
import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  API_BORROW_DETAIL,
  API_BORROWS_BULK_DELETE,
  API_BORROWS_EXPORT,
} from "@/constants/api";
import {
  mapBorrow,
  useBorrows,
  type BorrowRow,
} from "@/hooks/borrows/use-borrows";
import { useDeleteRecord } from "@/hooks/use-delete-record";
import {
  formatDateKey,
  parseDateKey,
  toEndOfDay,
  toStartOfDay,
} from "@/lib/date";
import { BORROW_EXPORT_COLUMNS } from "@/lib/admin-record-export-config";
import { exportAdminRecordExcel, exportAdminRecordPdf } from "@/lib/admin-record-pdf";
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
  const formatted = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${formatted} WIB`;
}

function matchesSearch(row: BorrowRow, query: string) {
  if (!query) return true;
  const haystack = [row.code, row.equipmentName, row.requesterName, row.purpose]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function AdminRecordPeminjamanAlatPage() {
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<BorrowRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<BorrowRow | null>(null);
  const [isExportingSelectedPdf, setIsExportingSelectedPdf] = useState(false);
  const [isExportingSelectedExcel, setIsExportingSelectedExcel] = useState(false);
  const { deleteRecord, deleteRecords, isDeleting } = useDeleteRecord();
  const { exportPdf, exportExcel, isExportingPdf, isExportingExcel } =
    useAdminRecordExport({
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

  const { borrows, totalCount, aggregates, isLoading, hasLoadedOnce, error } =
    useBorrows(
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
    () =>
      Math.max(
        1,
        Math.ceil((totalCount || filteredBorrows.length) / PAGE_SIZE),
      ),
    [totalCount, filteredBorrows.length],
  );

  const selectedCount = selectedIds.length;
  const selectedRows = useMemo(() => {
    const selectedIdSet = new Set(selectedIds.map((id) => String(id)));
    return borrows.filter((item) => selectedIdSet.has(String(item.id)));
  }, [borrows, selectedIds]);
  const allVisibleSelected =
    filteredBorrows.length > 0 &&
    filteredBorrows.every((item) => selectedIds.includes(item.id));
  const someVisibleSelected =
    filteredBorrows.some((item) => selectedIds.includes(item.id)) &&
    !allVisibleSelected;

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) =>
        borrows.some((item) => String(item.id) === String(id)),
      ),
    );
  }, [borrows]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

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

  const toggleItemSelection = (id: number | string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredBorrows.some((item) => item.id === id)),
      );
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredBorrows.forEach((item) => next.add(item.id));
      return Array.from(next);
    });
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const result = await deleteRecords(API_BORROWS_BULK_DELETE, selectedIds);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    if (result.failedCount && result.deletedCount) {
      toast.success(`${result.deletedCount} record peminjaman alat berhasil dihapus.`);
      toast.error(
        result.message ?? `${result.failedCount} record peminjaman alat gagal dihapus.`,
      );
    } else {
      toast.success(
        result.message ??
          `${result.deletedCount} record peminjaman alat berhasil dihapus.`,
      );
    }

    setIsBulkDeleteOpen(false);
    setSelectedIds([]);
    setReloadKey((prev) => prev + 1);
  };

  const handleExportSelectedPdf = async () => {
    if (!selectedRows.length) return;
    try {
      setIsExportingSelectedPdf(true);
      exportAdminRecordPdf({
        title: "Record Peminjaman Alat Terpilih",
        subtitle: `Total data: ${selectedRows.length}`,
        filename: "record-peminjaman-alat-terpilih.pdf",
        columns: BORROW_EXPORT_COLUMNS,
        rows: selectedRows,
      });
      toast.success("PDF record peminjaman alat terpilih berhasil diunduh.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengunduh PDF data terpilih.",
      );
    } finally {
      setIsExportingSelectedPdf(false);
    }
  };

  const handleExportSelectedExcel = async () => {
    if (!selectedRows.length) return;
    try {
      setIsExportingSelectedExcel(true);
      exportAdminRecordExcel({
        title: "Record Peminjaman Alat Terpilih",
        filename: "record-peminjaman-alat-terpilih.xlsx",
        columns: BORROW_EXPORT_COLUMNS,
        rows: selectedRows,
      });
      toast.success("Excel record peminjaman alat terpilih berhasil diunduh.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengunduh Excel data terpilih.",
      );
    } finally {
      setIsExportingSelectedExcel(false);
    }
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
              { label: "Expired", value: aggregates.expired },
              { label: "Borrowed", value: aggregates.borrowed, tone: "blue" },
              {
                label: "Returned Pending Inspection",
                value: aggregates.returned_pending_inspection,
              },
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
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="disabled:border-slate-200 disabled:text-slate-400"
                    disabled={selectedCount === 0 || isDeleting}
                  >
                    Aksi Terpilih
                    {selectedCount ? ` (${selectedCount})` : ""}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  sideOffset={6}
                  className="min-w-38"
                >
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                      <Download className="h-4 w-4" />
                      Export Terpilih
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="min-w-44">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={isExportingSelectedExcel}
                        onSelect={handleExportSelectedExcel}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Export Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={isExportingSelectedPdf}
                        onSelect={handleExportSelectedPdf}
                      >
                        <Download className="h-4 w-4" />
                        Export PDF
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem
                    className="cursor-pointer text-rose-600 focus:text-rose-700"
                    onSelect={() => setIsBulkDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus Terpilih
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <p className="text-xs text-slate-500 sm:text-right">
                Export mengikuti filter dan pencarian yang sedang aktif.
              </p>
              <AdminRecordExportActions
                onExportExcel={exportExcel}
                onExportPdf={exportPdf}
                isExportingExcel={isExportingExcel}
                isExportingPdf={isExportingPdf}
              />
            </div>
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
                  <th className="w-12 px-3 py-3 text-center font-medium text-slate-50">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      aria-label="Pilih semua record pada halaman ini"
                      className="h-4 w-4 rounded border-slate-300 align-middle"
                      checked={allVisibleSelected}
                      onChange={(event) =>
                        toggleSelectAllVisible(event.target.checked)
                      }
                    />
                  </th>
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
                    <td colSpan={8} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : filteredBorrows.length ? (
                  filteredBorrows.map((item) => (
                    <tr
                      key={String(item.id)}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Pilih record ${item.code}`}
                          className="h-4 w-4 rounded border-slate-300 align-middle"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium">
                        {item.code}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {item.equipmentName}
                      </td>
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
                            onClick={() => setDetailTarget(item)}
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
                      colSpan={8}
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

          <RecordDeleteDialog
            open={isBulkDeleteOpen}
            title="Hapus record peminjaman alat terpilih?"
            description={`${selectedCount} record yang dipilih akan dihapus permanen.`}
            isDeleting={isDeleting}
            onOpenChange={setIsBulkDeleteOpen}
            onConfirm={handleBulkDelete}
          />

          <Dialog
            open={Boolean(detailTarget)}
            onOpenChange={(open) => {
              if (!open) setDetailTarget(null);
            }}
          >
            <DialogContent
              showCloseButton={false}
              className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none sm:w-[50vw] sm:max-w-[960px] sm:min-w-[720px] sm:max-w-none"
            >
              <DialogHeader className="sr-only">
                <DialogTitle>Detail Peminjaman Alat</DialogTitle>
                <DialogDescription>
                  Detail record peminjaman alat ditampilkan dalam modal.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[85vh] overflow-y-auto px-1 pt-1">
                <AdminEquipmentBorrowRecordDetailContent
                  item={detailTarget}
                  isLoading={false}
                  error=""
                  backLabel="Tutup"
                  onBack={() => setDetailTarget(null)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}
