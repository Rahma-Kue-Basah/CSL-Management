"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  Check,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  Loader2,
  OctagonX,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import RelatedRoomDetailDialog from "@/components/admin/history/RelatedRoomDetailDialog";
import AdminRoomBookingHistoryDetailContent from "@/components/admin/history/AdminRoomBookingHistoryDetailContent";
import AdminHistoryBulkActions from "@/components/admin/history/AdminHistoryBulkActions";
import AdminHistoryExportActions from "@/components/admin/history/AdminHistoryExportActions";
import AdminHistorySummaryCards from "@/components/admin/history/AdminHistorySummaryCards";
import AdminHistoryTable from "@/components/admin/history/AdminHistoryTable";
import RelatedUserDetailDialog from "@/components/admin/history/RelatedUserDetailDialog";
import ConfirmDeleteDialog from "@/components/shared/confirm-delete-dialog";
import { AdminFilterCard } from "@/components/admin/admin-filter-card";
import { DataPagination } from "@/components/shared/data-pagination";
import InlineErrorAlert from "@/components/shared/inline-error-alert";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  API_BOOKING_DETAIL,
  API_BOOKINGS_ALL_EXPORT,
  API_BOOKINGS_ALL_REQUESTERS,
  API_BOOKINGS_BULK_DELETE,
} from "@/constants/api";
import { DEPARTMENT_VALUES } from "@/constants/departments";
import { useHistoryRequesterOptions } from "@/hooks/history/use-history-requester-options";
import {
  mapBooking,
  useBookings,
  type BookingRow,
} from "@/hooks/bookings/use-bookings";
import { useRoomOptions } from "@/hooks/rooms/use-room-options";
import { useUpdateBookingStatus } from "@/hooks/bookings/use-update-booking-status";
import { useDeleteRecord } from "@/hooks/use-delete-record";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { exportAdminRecordExcel, exportAdminRecordPdf } from "@/lib/admin-record-pdf";
import { formatDateKey, toEndOfDay, toStartOfDay } from "@/lib/date";
import { formatDateTimeWib } from "@/lib/date-format";
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
const ORDERING_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
];

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

export default function AdminRoomBookingHistoryPage() {
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const { profile } = useLoadProfile();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [department, setDepartment] = useState("");
  const [room, setRoom] = useState("");
  const [ordering, setOrdering] = useState("newest");
  const [createdRange, setCreatedRange] = useState<DateRange | undefined>();
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
  const createdAfter = createdRange?.from ? formatDateKey(createdRange.from) : "";
  const createdBefore = createdRange?.to
    ? formatDateKey(createdRange.to)
    : createdRange?.from
      ? formatDateKey(createdRange.from)
      : "";
  const { deleteRecord, deleteRecords, isDeleting } = useDeleteRecord();
  const { requesters } = useHistoryRequesterOptions(API_BOOKINGS_ALL_REQUESTERS);
  const { rooms } = useRoomOptions();
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
      requested_by: requestedBy,
      department,
      room,
      created_after: createdAfter ? toStartOfDay(createdAfter) : "",
      created_before: createdBefore ? toEndOfDay(createdBefore) : "",
    },
    mapItem: mapBooking,
    title: "Riwayat Peminjaman Lab",
    pdfFilename: "record-booking-ruangan.pdf",
    excelFilename: "record-booking-ruangan.xlsx",
    columns: BOOKING_EXPORT_COLUMNS,
    emptyMessage: "Tidak ada data peminjaman lab untuk diunduh.",
    pdfSuccessMessage: "PDF peminjaman lab berhasil diunduh.",
    excelSuccessMessage: "Excel peminjaman lab berhasil diunduh.",
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
      requestedBy,
      department,
      room,
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
  const visibleBookings = useMemo(() => {
    const items = [...filteredBookings];

    if (ordering === "oldest") {
      items.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      return items;
    }

    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return items;
  }, [filteredBookings, ordering]);
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
    visibleBookings.length > 0 &&
    visibleBookings.every((item) => selectedIds.includes(item.id));
  const someVisibleSelected =
    visibleBookings.some((item) => selectedIds.includes(item.id)) && !allVisibleSelected;

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
    setRequestedBy("");
    setDepartment("");
    setRoom("");
    setOrdering("newest");
    setCreatedRange(undefined);
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteRecord(API_BOOKING_DETAIL(deleteTarget.id));
    if (result.ok) {
      toast.success("Riwayat peminjaman lab berhasil dihapus.");
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
        prev.filter((id) => !visibleBookings.some((item) => item.id === id)),
      );
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleBookings.forEach((item) => next.add(item.id));
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
      toast.success(`${result.deletedCount} record peminjaman lab berhasil dihapus.`);
      toast.error(
        result.message ?? `${result.failedCount} record peminjaman lab gagal dihapus.`,
      );
    } else {
      toast.success(
        result.message ??
          `${result.deletedCount} record peminjaman lab berhasil dihapus.`,
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
        title: "Riwayat Peminjaman Lab Terpilih",
        subtitle: `Total data: ${selectedRows.length}`,
        filename: "record-booking-ruangan-terpilih.pdf",
        columns: BOOKING_EXPORT_COLUMNS,
        rows: selectedRows,
      });
      toast.success("PDF peminjaman lab terpilih berhasil diunduh.");
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
        title: "Riwayat Peminjaman Lab Terpilih",
        filename: "record-booking-ruangan-terpilih.xlsx",
        columns: BOOKING_EXPORT_COLUMNS,
        rows: selectedRows,
      });
      toast.success("Excel peminjaman lab terpilih berhasil diunduh.");
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
            title="Riwayat Peminjaman Lab"
            description="Pantau seluruh histori peminjaman lab dari pengguna."
            icon={<Eye className="h-5 w-5 text-sky-200" />}
          />

          <AdminHistorySummaryCards
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
              className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
              }}
            >
              <div className="min-w-0">
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-900/90">
                  Cari
                </label>
                <Input
                  type="search"
                  value={search}
                  placeholder="Kode"
                  className="h-8 border-slate-400 bg-white px-2 py-0 text-xs placeholder:text-xs md:text-xs shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-900/90">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-full rounded-md border border-slate-400 bg-white px-2 text-xs outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-900/90">
                  Nama Pemohon
                </label>
                <select
                  value={requestedBy}
                  onChange={(event) => {
                    setRequestedBy(event.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-full rounded-md border border-slate-400 bg-white px-2 text-xs outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                >
                  <option value="">Semua pemohon</option>
                  {requesters.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-900/90">
                  Prodi Pemohon
                </label>
                <select
                  value={department}
                  onChange={(event) => {
                    setDepartment(event.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-full rounded-md border border-slate-400 bg-white px-2 text-xs outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                >
                  <option value="">Semua prodi</option>
                  {DEPARTMENT_VALUES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-900/90">
                  Ruangan
                </label>
                <select
                  value={room}
                  onChange={(event) => {
                    setRoom(event.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-full rounded-md border border-slate-400 bg-white px-2 text-xs outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                >
                  <option value="">Semua ruangan</option>
                  {rooms.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-900/90">
                  Urutkan
                </label>
                <select
                  value={ordering}
                  onChange={(event) => {
                    setOrdering(event.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-full rounded-md border border-slate-400 bg-white px-2 text-xs outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                >
                  {ORDERING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 xl:col-start-3 xl:col-span-2">
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-900/90">
                  Tanggal Dibuat
                </label>
                <DateRangePicker
                  value={createdRange}
                  onChange={(value) => {
                    setCreatedRange(value);
                    setPage(1);
                  }}
                  clearable
                  buttonClassName="h-8 w-full rounded-md border-slate-400 bg-white px-2 text-xs shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                />
              </div>
            </form>
          </AdminFilterCard>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <AdminHistoryBulkActions
                selectedCount={selectedCount}
                isDeleting={isDeleting}
                isExportingSelectedExcel={isExportingSelectedExcel}
                isExportingSelectedPdf={isExportingSelectedPdf}
                onExportSelectedExcel={handleExportSelectedExcel}
                onExportSelectedPdf={handleExportSelectedPdf}
                onDeleteSelected={() => setIsBulkDeleteOpen(true)}
                onClearSelection={() => setSelectedIds([])}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <p className="text-xs text-slate-500 sm:text-right">
                Export mengikuti filter dan pencarian yang sedang aktif.
              </p>
              <AdminHistoryExportActions
                onExportExcel={exportExcel}
                onExportPdf={exportPdf}
                isExportingExcel={isExportingExcel}
                isExportingPdf={isExportingPdf}
              />
            </div>
          </div>

          {error ? (
            <InlineErrorAlert>{error}</InlineErrorAlert>
          ) : null}

          <AdminHistoryTable
            columns={[
              { label: "Kode" },
              { label: "Ruangan" },
              { label: "Pemohon" },
              { label: "Tujuan" },
              { label: "Waktu Mulai" },
              { label: "Waktu Selesai" },
              { label: "Status" },
              {
                label: "Aksi",
                className:
                  "sticky right-0 z-10 relative whitespace-nowrap bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-700",
              },
            ]}
            colSpan={9}
            hasRows={visibleBookings.length > 0}
            isLoading={isLoading}
            hasLoadedOnce={hasLoadedOnce}
            emptyMessage="Tidak ada data peminjaman ruangan."
            allVisibleSelected={allVisibleSelected}
            onToggleSelectAll={toggleSelectAllVisible}
            selectAllRef={selectAllRef}
          >
            {visibleBookings.map((booking) => (
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
                <td className="px-3 py-2 text-muted-foreground" title={booking.purpose}>
                  {booking.purpose}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {formatDateTimeWib(booking.startTime)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {formatDateTimeWib(booking.endTime)}
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
                          disabled={pendingAction.bookingId === booking.id}
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
                          disabled={pendingAction.bookingId === booking.id}
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
            ))}
          </AdminHistoryTable>

          <DataPagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount || filteredBookings.length}
            pageSize={PAGE_SIZE}
            itemLabel="peminjaman lab"
            isLoading={isLoading}
            onPageChange={setPage}
          />

          <ConfirmDeleteDialog
            open={Boolean(deleteTarget)}
            title="Hapus record peminjaman ruangan?"
            description={`Riwayat ${deleteTarget?.code ?? ""} akan dihapus permanen.`}
            isDeleting={isDeleting}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            onConfirm={handleDelete}
          />

          <ConfirmDeleteDialog
            open={isBulkDeleteOpen}
            title="Hapus record peminjaman lab terpilih?"
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
            subjectLabel="pengajuan peminjaman lab ini"
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
                <DialogTitle>Detail Peminjaman Lab</DialogTitle>
                <DialogDescription>
                  Detail riwayat peminjaman lab ditampilkan dalam modal.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[85vh] overflow-y-auto px-1 pt-1 pb-4">
                <AdminRoomBookingHistoryDetailContent
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
