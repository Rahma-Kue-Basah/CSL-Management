"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Loader2, OctagonX, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import RecordDeleteDialog from "@/components/admin/records/RecordDeleteDialog";
import { InventoryFilterCard } from "@/components/admin/inventory/inventory-filter-card";
import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { API_BOOKING_DETAIL } from "@/constants/api";
import { useBookings, type BookingRow } from "@/hooks/bookings/use-bookings";
import { useUpdateBookingStatus } from "@/hooks/bookings/use-update-booking-status";
import { useDeleteRecord } from "@/hooks/use-delete-record";
import { formatDateKey, parseDateKey, toEndOfDay, toStartOfDay } from "@/lib/date";
import {
  getStatusBadgeClass,
  getStatusDisplayLabel,
  REQUEST_STATUS_OPTIONS,
} from "@/lib/status";
import StatusConfirmDialog from "@/components/dialogs/StatusConfirmDialog";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = REQUEST_STATUS_OPTIONS;

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

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "-";
  return `${formatDateTime(start)} — ${formatDateTime(end)}`;
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

export default function AdminRecordPeminjamanRuanganPage() {
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
  const [deleteTarget, setDeleteTarget] = useState<BookingRow | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    booking: BookingRow;
    type: "approve" | "reject";
  } | null>(null);
  const { deleteRecord, isDeleting } = useDeleteRecord();
  const { updateBookingStatus, pendingAction } = useUpdateBookingStatus();

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const { bookings, totalCount, isLoading, hasLoadedOnce, error } = useBookings(
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

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || filteredBookings.length) / PAGE_SIZE)),
    [totalCount, filteredBookings.length],
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
    const result = await deleteRecord(API_BOOKING_DETAIL(deleteTarget.id));
    if (result.ok) {
      toast.success("Record peminjaman ruangan berhasil dihapus.");
      setDeleteTarget(null);
      setReloadKey((prev) => prev + 1);
      return;
    }
    toast.error(result.message);
  };

  const handleUpdateStatus = async () => {
    if (!statusTarget) return;
    const result = await updateBookingStatus(statusTarget.booking.id, statusTarget.type);
    if (result.ok) {
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

  return (
    <section className="w-full min-w-0 space-y-4 px-4 pb-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-4">
          <AdminPageHeader
            title="Record Peminjaman Ruangan"
            description="Pantau seluruh histori peminjaman ruangan dari pengguna."
            icon={<Eye className="h-5 w-5 text-sky-200" />}
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
                  buttonClassName="border-slate-400 shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
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
                  buttonClassName="border-slate-400 shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                />
              </div>
            </form>
          </InventoryFilterCard>

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
                    <td colSpan={9} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : filteredBookings.length ? (
                  filteredBookings.map((booking) => (
                    <tr key={String(booking.id)} className="border-b last:border-b-0">
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
                            onClick={() => {
                              navigate(`/admin/records/room-bookings/${booking.id}`, {
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
                      colSpan={9}
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
        </div>
      </div>
    </section>
  );
}
