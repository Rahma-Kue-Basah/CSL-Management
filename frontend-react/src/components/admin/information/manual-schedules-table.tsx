"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScheduleItem } from "@/hooks/schedules/use-schedules";

function formatTimeWib(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const time = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${time} WIB`;
}

type ManualSchedulesTableProps = {
  schedules: ScheduleItem[];
  isLoading: boolean;
  onEdit: (item: ScheduleItem) => void;
  onDelete: (item: ScheduleItem) => void;
};

export function ManualSchedulesTable({
  schedules,
  isLoading,
  onEdit,
  onDelete,
}: ManualSchedulesTableProps) {
  return (
    <div className="w-full max-w-full overflow-x-auto rounded border border-slate-200 bg-card">
      <table className="w-full min-w-[1120px] table-fixed">
        <thead className="border-b border-slate-800 bg-slate-900">
          <tr className="text-left text-sm">
            <th className="w-[180px] px-3 py-3 font-medium text-slate-50">
              Tanggal
            </th>
            <th className="w-[240px] px-3 py-3 font-medium text-slate-50">
              Judul
            </th>
            <th className="w-[220px] px-3 py-3 font-medium text-slate-50">
              Waktu Mulai
            </th>
            <th className="w-[220px] px-3 py-3 font-medium text-slate-50">
              Waktu Selesai
            </th>
            <th className="w-[150px] px-3 py-3 font-medium text-slate-50">
              Kategori
            </th>
            <th className="w-[140px] px-3 py-3 font-medium text-slate-50">
              Status
            </th>
            <th className="sticky right-0 z-10 relative w-[140px] bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-700">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Skeleton className="h-5 w-40" />
                </div>
              </td>
            </tr>
          ) : schedules.length ? (
            schedules.map((item) => (
              <tr key={item.id} className="border-b last:border-b-0">
                <td className="px-3 py-2">
                  {new Date(item.start_time).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="truncate px-3 py-2 font-medium text-slate-900">
                  {item.title}
                </td>
                <td className="px-3 py-2">{formatTimeWib(item.start_time)}</td>
                <td className="px-3 py-2">{formatTimeWib(item.end_time)}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                    {item.category}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {item.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="sticky right-0 z-10 relative bg-card px-3 py-2 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                  <div className="flex justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => onDelete(item)}
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
                Belum ada jadwal manual yang cocok dengan filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ManualSchedulesTable;
