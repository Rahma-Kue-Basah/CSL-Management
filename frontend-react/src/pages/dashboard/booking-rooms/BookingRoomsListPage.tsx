"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Eye,
  Filter,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { useBookings } from "@/hooks/bookings/use-bookings";
import { formatDateKey, parseDateKey, toEndOfDay, toStartOfDay } from "@/lib/date";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDateTime(value?: string | null) {
  if (!value || value === "-") return "-";
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

export default function BookingRoomsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const { bookings, totalCount, isLoading, hasLoadedOnce, error } = useBookings(
    page,
    PAGE_SIZE,
    {
      status,
      createdAfter: createdAfter ? toStartOfDay(createdAfter) : "",
      createdBefore: createdBefore ? toEndOfDay(createdBefore) : "",
    },
    0,
    "my",
  );

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    const roomBookings = bookings.filter(
      (booking) => booking.roomName && booking.roomName !== "-",
    );

    if (!query) return roomBookings;
    return roomBookings.filter((booking) => {
      const haystack = [
        booking.code,
        booking.roomName,
        booking.requesterName,
        booking.purpose,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [bookings, search]);

  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || filteredBookings.length) / PAGE_SIZE),
  );
  const pendingCount = filteredBookings.filter(
    (item) => item.status === "pending",
  ).length;
  const approvedCount = filteredBookings.filter(
    (item) => item.status === "approved",
  ).length;
  const completedCount = filteredBookings.filter(
    (item) => item.status === "completed",
  ).length;
  const rejectedCount = filteredBookings.filter(
    (item) => item.status === "rejected",
  ).length;

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setCreatedAfter("");
    setCreatedBefore("");
    setPage(1);
    setFilterOpen(false);
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Total Pengajuan"
          value={filteredBookings.length}
          icon={<Building2 className="h-4 w-4" />}
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
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800"
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
                  placeholder="Kode, ruangan, peminjam, tujuan"
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
        <table className="w-full min-w-[920px] table-fixed">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr className="text-left text-sm">
              <th className="w-[140px] px-3 py-3 font-medium text-slate-50">
                Kode
              </th>
              <th className="w-[190px] px-3 py-3 font-medium text-slate-50">
                Ruangan
              </th>
              <th className="w-[180px] px-3 py-3 font-medium text-slate-50">
                Peminjam
              </th>
              <th className="w-[240px] px-3 py-3 font-medium text-slate-50">
                Waktu
              </th>
              <th className="w-[180px] px-3 py-3 font-medium text-slate-50">
                Tujuan
              </th>
              <th className="w-[120px] px-3 py-3 font-medium text-slate-50">
                Status
              </th>
              <th className="sticky right-0 z-20 w-[120px] bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 shadow-[-1px_0_0_0_rgba(51,65,85,1)]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading || !hasLoadedOnce ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data...
                  </div>
                </td>
              </tr>
            ) : filteredBookings.length ? (
              filteredBookings.map((booking) => (
                <tr
                  key={String(booking.id)}
                  className="border-b last:border-b-0"
                >
                  <td className="truncate px-3 py-2.5 font-medium text-slate-800">
                    {booking.code}
                  </td>
                  <td className="truncate px-3 py-2.5">{booking.roomName}</td>
                  <td className="truncate px-3 py-2.5">
                    {booking.requesterName}
                  </td>
                  <td className="truncate px-3 py-2.5">
                    {formatDateTime(booking.startTime)} -{" "}
                    {formatDateTime(booking.endTime)}
                  </td>
                  <td className="truncate px-3 py-2.5">{booking.purpose}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(booking.status)}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="sticky right-0 z-10 bg-white px-3 py-2.5 text-center shadow-[-1px_0_0_0_rgba(226,232,240,1)]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-slate-300 text-slate-700"
                      onClick={() =>
                        router.push(`/booking-rooms/${booking.id}`)
                      }
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  Belum ada pengajuan booking ruangan.
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
    </section>
  );
}
