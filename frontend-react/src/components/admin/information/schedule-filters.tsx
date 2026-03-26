"use client";

import { Search } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { AdminFilterCard } from "@/components/admin/admin-filter-card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";

type RoomOption = {
  id: string | number;
  label: string;
};

type SourceOption = {
  value: string;
  label: string;
};

type ScheduleFiltersProps = {
  open: boolean;
  query: string;
  roomFilter: string;
  sourceFilter?: string;
  sourceOptions?: SourceOption[];
  dateRange?: DateRange;
  sortOrder?: string;
  rooms: RoomOption[];
  onToggle: () => void;
  onReset: () => void;
  onQueryChange: (value: string) => void;
  onRoomFilterChange: (value: string) => void;
  onSourceFilterChange?: (value: string) => void;
  onDateRangeChange?: (value: DateRange | undefined) => void;
  onSortOrderChange?: (value: string) => void;
};

export function ScheduleFilters({
  open,
  query,
  roomFilter,
  sourceFilter,
  sourceOptions,
  dateRange,
  sortOrder,
  rooms,
  onToggle,
  onReset,
  onQueryChange,
  onRoomFilterChange,
  onSourceFilterChange,
  onDateRangeChange,
  onSortOrderChange,
}: ScheduleFiltersProps) {
  const hasSourceFilter =
    typeof sourceFilter === "string" &&
    Array.isArray(sourceOptions) &&
    sourceOptions.length > 0 &&
    typeof onSourceFilterChange === "function";
  const hasDateFilter = typeof onDateRangeChange === "function";
  const hasSortOrder =
    typeof sortOrder === "string" && typeof onSortOrderChange === "function";
  const totalColumns =
    2 + Number(hasSourceFilter) + Number(hasDateFilter) + Number(hasSortOrder);
  const columnClass =
    totalColumns >= 5
      ? "md:grid-cols-5"
      : totalColumns === 4
        ? "md:grid-cols-4"
        : totalColumns === 3
          ? "md:grid-cols-3"
          : "md:grid-cols-2";

  return (
    <AdminFilterCard open={open} onToggle={onToggle} onReset={onReset}>
      <div className={`grid grid-cols-1 gap-3 ${columnClass}`}>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-800">Pencarian</label>
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Cari judul, deskripsi, atau agenda"
              className="h-6 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-800">Ruangan</label>
          <select
            value={roomFilter}
            onChange={(event) => onRoomFilterChange(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Semua Ruangan</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.label}
              </option>
            ))}
          </select>
        </div>
        {hasSourceFilter ? (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-800">Sumber</label>
            <select
              value={sourceFilter}
              onChange={(event) => onSourceFilterChange(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              {sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {hasDateFilter ? (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-800">Cari Tanggal</label>
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              clearable
              className="w-full"
              buttonClassName="h-11 rounded-lg border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>
        ) : null}
        {hasSortOrder ? (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-800">Urutkan</label>
            <select
              value={sortOrder}
              onChange={(event) => onSortOrderChange(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="newest">Tanggal Terbaru</option>
              <option value="oldest">Tanggal Terlama</option>
              <option value="title-asc">Judul A-Z</option>
              <option value="title-desc">Judul Z-A</option>
            </select>
          </div>
        ) : null}
      </div>
    </AdminFilterCard>
  );
}

export default ScheduleFilters;
