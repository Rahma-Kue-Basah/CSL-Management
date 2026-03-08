"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, X } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InventoryFilterCard } from "@/components/admin/inventory/inventory-filter-card";
import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useBookings, type BookingRow } from "@/hooks/bookings/use-bookings";
import { useIsMobile } from "@/hooks/use-mobile";

const PAGE_SIZE = 10;

type ActionType = "detail";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

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

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    case "completed":
      return "bg-sky-100 text-sky-700";
    case "cancelled":
      return "bg-slate-200 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function toStartOfDay(value: string) {
  return value ? `${value}T00:00:00` : "";
}

function toEndOfDay(value: string) {
  return value ? `${value}T23:59:59` : "";
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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);

  const isMobile = useIsMobile();
  const isActionOpen = Boolean(activeAction);

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

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
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
                <Input
                  type="date"
                  value={createdAfter}
                  className="border-slate-400 bg-white shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                  onChange={(event) => {
                    setCreatedAfter(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Dibuat Sampai
                </label>
                <Input
                  type="date"
                  value={createdBefore}
                  className="border-slate-400 bg-white shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                  onChange={(event) => {
                    setCreatedBefore(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </form>
          </InventoryFilterCard>

          {error ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="w-full max-w-full overflow-x-auto rounded border border-slate-200 bg-card">
            <table className="w-full min-w-[1000px] table-fixed">
              <thead className="border-b border-slate-800 bg-slate-900">
                <tr className="text-left text-sm">
                  <th className="w-[140px] px-3 py-3 font-medium text-slate-50">
                    Kode
                  </th>
                  <th className="w-[220px] px-3 py-3 font-medium text-slate-50">
                    Ruangan
                  </th>
                  <th className="w-[200px] px-3 py-3 font-medium text-slate-50">
                    Peminjam
                  </th>
                  <th className="w-[260px] px-3 py-3 font-medium text-slate-50">
                    Waktu
                  </th>
                  <th className="w-[140px] px-3 py-3 font-medium text-slate-50">
                    Status
                  </th>
                  <th className="sticky right-0 z-10 relative w-[120px] bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading || !hasLoadedOnce ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : filteredBookings.length ? (
                  filteredBookings.map((booking) => (
                    <tr key={String(booking.id)} className="border-b last:border-b-0">
                      <td className="truncate px-3 py-2 font-medium">
                        {booking.code}
                      </td>
                      <td className="truncate px-3 py-2">{booking.roomName}</td>
                      <td className="truncate px-3 py-2 text-muted-foreground">
                        {booking.requesterName}
                      </td>
                      <td className="px-3 py-2">
                        {formatDateRange(booking.startTime, booking.endTime)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(
                            booking.status,
                          )}`}
                        >
                          {booking.status || "-"}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 relative bg-card px-3 py-2 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setActiveAction("detail");
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
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
        </div>

        {!isMobile && isActionOpen ? (
          <aside className="sticky top-0 hidden self-start w-full max-w-[380px] shrink-0 rounded border bg-card shadow-xs lg:block">
            <BookingDetailPanel
              booking={selectedBooking}
              onClose={() => {
                setActiveAction(null);
                setSelectedBooking(null);
              }}
            />
          </aside>
        ) : null}
      </div>

      <Sheet
        open={isMobile && isActionOpen}
        onOpenChange={(open) => {
          if (!open) {
            setActiveAction(null);
            setSelectedBooking(null);
          }
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[92vw] p-0 sm:max-w-md [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]"
        >
          <BookingDetailPanel
            booking={selectedBooking}
            onClose={() => {
              setActiveAction(null);
              setSelectedBooking(null);
            }}
          />
        </SheetContent>
      </Sheet>
    </section>
  );
}

type BookingDetailPanelProps = {
  booking: BookingRow | null;
  onClose: () => void;
};

function BookingDetailPanel({ booking, onClose }: BookingDetailPanelProps) {
  if (!booking) return null;

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Detail Peminjaman
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {booking.code}
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm text-slate-700 shadow-xs">
        <div className="grid gap-3">
          <DetailRow label="Ruangan" value={booking.roomName} />
          <DetailRow label="Peminjam" value={booking.requesterName} />
          <DetailRow label="Status" value={booking.status} />
          <DetailRow label="Tujuan" value={booking.purpose} />
          <DetailRow label="Waktu" value={formatDateRange(booking.startTime, booking.endTime)} />
          <DetailRow label="Dibuat" value={formatDateTime(booking.createdAt)} />
          <DetailRow
            label="Diupdate"
            value={booking.updatedAt ? formatDateTime(booking.updatedAt) : "-"}
          />
          <DetailRow label="Disetujui Oleh" value={booking.approvedByName} />
          <DetailRow label="Peralatan" value={booking.equipmentName} />
          <DetailRow label="Jumlah Alat" value={booking.equipmentQty} />
          <DetailRow label="Catatan" value={booking.note || "-"} />
        </div>
      </div>
    </div>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}
