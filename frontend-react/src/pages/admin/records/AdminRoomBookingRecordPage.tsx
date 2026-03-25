"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  Loader2,
  OctagonX,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import RelatedRoomDetailDialog from "@/components/admin/records/RelatedRoomDetailDialog";
import AdminRoomBookingRecordDetailContent from "@/components/admin/records/AdminRoomBookingRecordDetailContent";
import AdminRecordExportActions from "@/components/admin/records/AdminRecordExportActions";
import AdminRecordSummaryCards from "@/components/admin/records/AdminRecordSummaryCards";
import RelatedUserDetailDialog from "@/components/admin/records/RelatedUserDetailDialog";
import RecordDeleteDialog from "@/components/admin/records/RecordDeleteDialog";
import { AdminFilterCard } from "@/components/admin/admin-filter-card";
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
  API_BOOKING_DETAIL,
  API_BOOKINGS_ALL_EXPORT,
  API_BOOKINGS_BULK_DELETE,
} from "@/constants/api";
import {
  mapBooking,
  useBookings,
  type BookingRow,
} from "@/hooks/bookings/use-bookings";
import { useUpdateBookingStatus } from "@/hooks/bookings/use-update-booking-status";
import { useDeleteRecord } from "@/hooks/use-delete-record";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { exportAdminRecordExcel, exportAdminRecordPdf } from "@/lib/admin-record-pdf";
import { formatDateKey, parseDateKey, toEndOfDay, toStartOfDay } from "@/lib/date";
import { BOOKING_EXPORT_COLUMNS } from "@/lib/admin-record-export-config";
import {
  getStatusBadgeClass,
  getStatusDisplayLabel,
  REQUEST_STATUS_OPTIONS,
} from "@/lib/status";
import StatusConfirmDialog from "@/components/dialogs/StatusConfirmDialog";
import { useAdminRecordExport } from "@/hooks/admin/use-admin-record-export";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = REQUEST_STATUS_OPTIONS;

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

function matchesSearch(booking: BookingRow, query: string) {
  if (!query) return true;
  const haystack = [
    booking.code,
    booking.roomName,
    booking.requesterName,
    booking.purpose,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function AdminRoomBookingRecordPage() {
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const { profile } = useLoadProfile();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<BookingRow | null>(null);
  const [detailTarget, setDetailTarget] = useState<BookingRow | null>(null);
  const [relatedRoomId, setRelatedRoomId] = useState<string | number | null>(null);
  const [relatedUserId, setRelatedUserId] = useState<string | number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isExportingSelectedPdf, setIsExportingSelectedPdf] = useState(false);
  const [isExportingSelectedExcel, setIsExportingSelectedExcel] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{
    booking: BookingRow;
    type: "approve" | "reject";
  } | null>(null);
  const { deleteRecord, deleteRecords, isDeleting } = useDeleteRecord();
  const { updateBookingStatus, pendingAction } = useUpdateBookingStatus();
  const {
    exportPdf,
    exportExcel,
    isExportingPdf,
    isExportingExcel,
  } = useAdminRecordExport({
    endpoint: API_BOOKINGS_ALL_EXPORT,
    filters: {
      q: debouncedSearch,
      status,
      created_after: createdAfter ? toStartOfDay(createdAfter) : "",
      created_before: createdBefore ? toEndOfDay(createdBefore) : "",
    },
    mapItem: mapBooking,
    title: "Record Booking Ruangan",
    pdfFilename: "record-booking-ruangan.pdf",
    excelFilename: "record-booking-ruangan.xlsx",
    columns: BOOKING_EXPORT_COLUMNS,
    emptyMessage: "Tidak ada data booking ruangan untuk diunduh.",
    pdfSuccessMessage: "PDF booking ruangan berhasil diunduh.",
    excelSuccessMessage: "Excel booking ruangan berhasil diunduh.",
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const { bookings, totalCount, aggregates, isLoading, hasLoadedOnce, error } = useBookings(
    page,
    PAGE_SIZE,
    {
      status,
      createdAfter: createdAfter ? toStartOfDay(createdAfter) : "",
      createdBefore: createdBefore ? toEndOfDay(createdBefore) : "",
    },
    reloadKey,
    "all",
  );

  const filteredBookings = useMemo(
    () => bookings.filter((booking) => matchesSearch(booking, debouncedSearch)),
    [bookings, debouncedSearch],
  );
  const selectedRows = useMemo(() => {
    const selectedIdSet = new Set(selectedIds.map((id) => String(id)));
    return bookings.filter((item) => selectedIdSet.has(String(item.id)));
  }, [bookings, selectedIds]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || filteredBookings.length) / PAGE_SIZE)),
    [totalCount, filteredBookings.length],
  );
  const selectedCount = selectedIds.length;
  const allVisibleSelected =
    filteredBookings.length > 0 &&
    filteredBookings.every((item) => selectedIds.includes(item.id));
  const someVisibleSelected =
    filteredBookings.some((item) => selectedIds.includes(item.id)) && !allVisibleSelected;

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => bookings.some((item) => String(item.id) === String(id))),
    );
  }, [bookings]);

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
    const result = await deleteRecord(API_BOOKING_DETAIL(deleteTarget.id));
    if (result.ok) {
      toast.success("Record peminjaman ruangan berhasil dihapus.");
      setDeleteTarget(null);
      setReloadKey((prev) => prev + 1);
      return;
    }
    toast.error(result.message);
  };

  const toggleItemSelection = (id: number | string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredBookings.some((item) => item.id === id)),
      );
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredBookings.forEach((item) => next.add(item.id));
      return Array.from(next);
    });
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const result = await deleteRecords(API_BOOKINGS_BULK_DELETE, selectedIds);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    if (result.failedCount && result.deletedCount) {
      toast.success(`${result.deletedCount} record booking ruangan berhasil dihapus.`);
      toast.error(
        result.message ?? `${result.failedCount} record booking ruangan gagal dihapus.`,
      );
    } else {
      toast.success(
        result.message ??
          `${result.deletedCount} record booking ruangan berhasil dihapus.`,
      );
    }

    setIsBulkDeleteOpen(false);
    setSelectedIds([]);
    setReloadKey((prev) => prev + 1);
  };

  const handleUpdateStatus = async () => {
    if (!statusTarget) return;
    const currentTarget = statusTarget;
    const result = await updateBookingStatus(statusTarget.booking.id, statusTarget.type);
    if (result.ok) {
      const now = new Date().toISOString();
      if (detailTarget?.id === currentTarget.booking.id) {
        setDetailTarget((current) =>
          current
            ? {
                ...current,
                status: currentTarget.type === "approve" ? "Approved" : "Rejected",
                updatedAt: now,
                approvedById:
                  currentTarget.type === "approve"
                    ? String(profile?.id ?? current.approvedById)
                    : current.approvedById,
                approvedByName:
                  currentTarget.type === "approve"
                    ? profile?.name || current.approvedByName
                    : current.approvedByName,
                approvedByEmail:
                  currentTarget.type === "approve"
                    ? profile?.email || current.approvedByEmail
                    : current.approvedByEmail,
              }
            : current,
        );
      }
      toast.success(
        statusTarget.type === "approve"
          ? "Booking ruangan berhasil disetujui."
          : "Booking ruangan berhasil ditolak.",
      );
      setStatusTarget(null);
      setReloadKey((prev) => prev + 1);
      return;
    }

    toast.error(result.message);
  };

  const handleExportSelectedPdf = async () => {
    if (!selectedRows.length) return;
    try {
      setIsExportingSelectedPdf(true);
      exportAdminRecordPdf({
        title: "Record Booking Ruangan Terpilih",
        subtitle: `Total data: ${selectedRows.length}`,
        filename: "record-booking-ruangan-terpilih.pdf",
        columns: BOOKING_EXPORT_COLUMNS,
        rows: selectedRows,
      });
      toast.success("PDF booking ruangan terpilih berhasil diunduh.");
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
        title: "Record Booking Ruangan Terpilih",
        filename: "record-booking-ruangan-terpilih.xlsx",
        columns: BOOKING_EXPORT_COLUMNS,
        rows: selectedRows,
      });
      toast.success("Excel booking ruangan terpilih berhasil diunduh.");
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
            title="Record Booking Ruangan"
            description="Pantau seluruh histori booking ruangan dari pengguna."
            icon={<Eye className="h-5 w-5 text-sky-200" />}
          />

          <AdminRecordSummaryCards
            items={[
              { label: "Total", value: aggregates.total, tone: "blue" },
              { label: "Pending", value: aggregates.pending },
              { label: "Approved", value: aggregates.approved },
              { label: "Completed", value: aggregates.completed },
              { label: "Rejected", value: aggregates.rejected },
              { label: "Expired", value: aggregates.expired },
            ]}
          />

          <AdminFilterCard
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
                  placeholder="Kode, ruangan, atau peminjam"
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
          </AdminFilterCard>

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
                      onChange={(event) => toggleSelectAllVisible(event.target.checked)}
                    />
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Kode
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Ruangan
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Peminjam
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Orang
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Peralatan
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
                    <td colSpan={10} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : filteredBookings.length ? (
                  filteredBookings.map((booking) => (
                    <tr key={String(booking.id)} className="border-b last:border-b-0">
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Pilih record ${booking.code}`}
                          className="h-4 w-4 rounded border-slate-300 align-middle"
                          checked={selectedIds.includes(booking.id)}
                          onChange={() => toggleItemSelection(booking.id)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium">
                        {booking.code}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{booking.roomName}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {booking.requesterName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{booking.attendeeCount}</td>
                      <td
                        className="whitespace-nowrap px-3 py-2 text-muted-foreground"
                        title={booking.equipmentName}
                      >
                        {booking.equipmentName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {formatDateTime(booking.startTime)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {formatDateTime(booking.endTime)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(
                            booking.status,
                          )}`}
                        >
                          {getStatusDisplayLabel(booking.status)}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 relative bg-card px-3 py-2 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                        <div className="flex justify-center gap-2">
                          {booking.status === "Pending" ? (
                            <>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                disabled={
                                  pendingAction.bookingId === booking.id
                                }
                                onClick={() =>
                                  setStatusTarget({
                                    booking,
                                    type: "approve",
                                  })
                                }
                              >
                                {pendingAction.bookingId === booking.id &&
                                pendingAction.type === "approve" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                disabled={
                                  pendingAction.bookingId === booking.id
                                }
                                onClick={() =>
                                  setStatusTarget({
                                    booking,
                                    type: "reject",
                                  })
                                }
                              >
                                {pendingAction.bookingId === booking.id &&
                                pendingAction.type === "reject" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <OctagonX className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          ) : null}
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => setDetailTarget(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => setDeleteTarget(booking)}
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
                      colSpan={10}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      Tidak ada data peminjaman ruangan.
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
            title="Hapus record peminjaman ruangan?"
            description={`Record ${deleteTarget?.code ?? ""} akan dihapus permanen.`}
            isDeleting={isDeleting}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            onConfirm={handleDelete}
          />

          <RecordDeleteDialog
            open={isBulkDeleteOpen}
            title="Hapus record booking ruangan terpilih?"
            description={`${selectedCount} record yang dipilih akan dihapus permanen.`}
            isDeleting={isDeleting}
            onOpenChange={setIsBulkDeleteOpen}
            onConfirm={handleBulkDelete}
          />

          <StatusConfirmDialog
            open={Boolean(statusTarget)}
            actionType={statusTarget?.type ?? null}
            onOpenChange={(open) => {
              if (!open) setStatusTarget(null);
            }}
            onConfirm={handleUpdateStatus}
            isSubmitting={
              statusTarget
                ? pendingAction.bookingId === statusTarget.booking.id
                : false
            }
            subjectLabel="pengajuan booking ruangan ini"
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
                <DialogTitle>Detail Booking Ruangan</DialogTitle>
                <DialogDescription>
                  Detail record booking ruangan ditampilkan dalam modal.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[85vh] overflow-y-auto px-1 pt-1 pb-4">
                <AdminRoomBookingRecordDetailContent
                  booking={detailTarget}
                  isLoading={false}
                  error=""
                  showAside={false}
                  backLabel="Tutup"
                  onBack={() => setDetailTarget(null)}
                  onOpenRoomDetail={setRelatedRoomId}
                  onOpenUserDetail={setRelatedUserId}
                  actions={
                    detailTarget?.status === "Pending" ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          className="border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() =>
                            detailTarget &&
                            setStatusTarget({
                              booking: detailTarget,
                              type: "approve",
                            })
                          }
                          disabled={detailTarget ? pendingAction.bookingId === detailTarget.id : false}
                        >
                          {detailTarget &&
                          pendingAction.bookingId === detailTarget.id &&
                          pendingAction.type === "approve" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Setujui
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="border border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
                          onClick={() =>
                            detailTarget &&
                            setStatusTarget({
                              booking: detailTarget,
                              type: "reject",
                            })
                          }
                          disabled={detailTarget ? pendingAction.bookingId === detailTarget.id : false}
                        >
                          {detailTarget &&
                          pendingAction.bookingId === detailTarget.id &&
                          pendingAction.type === "reject" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <OctagonX className="h-4 w-4" />
                          )}
                          Tolak
                        </Button>
                      </>
                    ) : null
                  }
                />
              </div>
            </DialogContent>
          </Dialog>

          <RelatedRoomDetailDialog
            open={Boolean(relatedRoomId)}
            roomId={relatedRoomId}
            onOpenChange={(open) => {
              if (!open) setRelatedRoomId(null);
            }}
          />

          <RelatedUserDetailDialog
            open={Boolean(relatedUserId)}
            userId={relatedUserId}
            onOpenChange={(open) => {
              if (!open) setRelatedUserId(null);
            }}
          />
        </div>
      </div>
    </section>
  );
}
