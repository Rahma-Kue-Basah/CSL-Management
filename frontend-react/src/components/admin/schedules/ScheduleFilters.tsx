"use client";

import { Search } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { AdminFilterCard } from "@/components/admin/shared/AdminFilterCard";
import {
  AdminFilterField,
  AdminFilterGrid,
  ADMIN_FILTER_SELECT_CLASS,
} from "@/components/admin/shared/AdminFilterFields";
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
  const totalColumns = (2 + Number(hasSourceFilter) + Number(hasDateFilter) + Number(hasSortOrder)) as 2 | 3 | 4 | 5;

  return (
    <AdminFilterCard open={open} onToggle={onToggle} onReset={onReset}>
      <AdminFilterGrid columns={totalColumns}>
        <AdminFilterField label="Pencarian">
          <div className="flex min-w-0 items-center gap-2 rounded-md border border-slate-400 bg-white px-2 py-1">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Cari judul, deskripsi, atau agenda"
              className="h-6 border-0 bg-transparent px-0 text-xs placeholder:text-xs shadow-none focus-visible:ring-0"
            />
          </div>
        </AdminFilterField>
        <AdminFilterField label="Ruangan">
          <select
            value={roomFilter}
            onChange={(event) => onRoomFilterChange(event.target.value)}
            className={ADMIN_FILTER_SELECT_CLASS}
          >
            <option value="">Semua Ruangan</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.label}
              </option>
            ))}
          </select>
        </AdminFilterField>
        {hasSourceFilter ? (
          <AdminFilterField label="Sumber">
            <select
              value={sourceFilter}
              onChange={(event) => onSourceFilterChange(event.target.value)}
              className={ADMIN_FILTER_SELECT_CLASS}
            >
              {sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
                ))}
              </select>
          </AdminFilterField>
        ) : null}
        {hasDateFilter ? (
          <AdminFilterField label="Cari Tanggal">
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              clearable
              className="w-full"
              buttonClassName="h-8 rounded-md border-slate-400 px-2 py-0 text-xs"
            />
          </AdminFilterField>
        ) : null}
        {hasSortOrder ? (
          <AdminFilterField label="Urutkan">
            <select
              value={sortOrder}
              onChange={(event) => onSortOrderChange(event.target.value)}
              className={ADMIN_FILTER_SELECT_CLASS}
            >
              <option value="newest">Tanggal Terbaru</option>
              <option value="oldest">Tanggal Terlama</option>
              <option value="title-asc">Judul A-Z</option>
              <option value="title-desc">Judul Z-A</option>
            </select>
          </AdminFilterField>
        ) : null}
      </AdminFilterGrid>
    </AdminFilterCard>
  );
}

export default ScheduleFilters;
