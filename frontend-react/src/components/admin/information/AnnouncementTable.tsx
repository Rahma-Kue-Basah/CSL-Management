"use client";

import type { RefObject } from "react";
import { Eye, Loader2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui";
import { TableActionIconButton } from "@/components/shared";
import type { Announcement } from "@/hooks/information/announcements";
import { formatDateTimeWib } from "@/lib/date";
import { stripHtmlTags, summarizeText } from "@/lib/text";

type AnnouncementTableProps = {
  announcements: Announcement[];
  isLoading: boolean;
  emptyMessage?: string;
  selectedIds: Array<string | number>;
  allVisibleSelected: boolean;
  selectAllRef: RefObject<HTMLInputElement | null>;
  onToggleSelectAllVisible: (checked: boolean) => void;
  onToggleItemSelection: (announcement: Announcement) => void;
  onView: (announcement: Announcement) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
};

export default function AnnouncementTable({
  announcements,
  isLoading,
  emptyMessage = "Tidak ada data pengumuman.",
  selectedIds,
  allVisibleSelected,
  selectAllRef,
  onToggleSelectAllVisible,
  onToggleItemSelection,
  onView,
  onEdit,
  onDelete,
}: AnnouncementTableProps) {
  return (
    <div className="w-full min-w-0 overflow-x-auto rounded border border-slate-200 bg-card [scrollbar-width:thin]">
      <table className="w-full min-w-[980px] table-fixed">
        <thead className="border-b border-slate-800 bg-slate-900">
          <tr className="text-left text-sm">
            <th className="w-12 px-3 py-3 text-center font-medium text-slate-50">
              <input
                ref={selectAllRef}
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 align-middle"
                checked={allVisibleSelected}
                onChange={(event) => onToggleSelectAllVisible(event.target.checked)}
                aria-label="Pilih semua pengumuman yang tampil"
              />
            </th>
            <th className="w-[260px] px-3 py-3 font-medium text-slate-50">
              Judul
            </th>
            <th className="w-[440px] px-3 py-3 font-medium text-slate-50">
              Isi
            </th>
            <th className="w-[140px] px-3 py-3 font-medium text-slate-50">
              Dibuat
            </th>
            <th className="sticky right-0 z-10 relative w-[144px] bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 shadow-[-6px_0_10px_-10px_rgba(15,23,42,0.35)] before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-700">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </td>
            </tr>
          ) : announcements.length ? (
            announcements.map((announcement) => (
              <tr key={String(announcement.id)} className="border-b last:border-b-0">
                <td className="px-3 py-2 text-center align-top">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 align-middle"
                    checked={selectedIds.includes(announcement.id)}
                    onChange={() => onToggleItemSelection(announcement)}
                    aria-label={`Pilih pengumuman ${announcement.title}`}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="whitespace-normal break-words font-medium text-slate-900">
                    {summarizeText(announcement.title || "", 160)}
                  </div>
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="whitespace-normal break-words text-muted-foreground">
                    {summarizeText(stripHtmlTags(announcement.content || ""), 320)}
                  </div>
                </td>
                <td className="px-3 py-2 align-top text-muted-foreground">
                  {formatDateTimeWib(announcement.created_at)}
                </td>
                <td className="sticky right-0 z-10 relative bg-card px-3 py-2 align-top shadow-[-6px_0_10px_-10px_rgba(15,23,42,0.18)] before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                  <div className="flex justify-center gap-2">
                    <TableActionIconButton
                      label="Lihat detail"
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onView(announcement)}
                      icon={<Eye className="h-4 w-4" />}
                    />
                    <TableActionIconButton
                      label="Edit pengumuman"
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onEdit(announcement)}
                      icon={<Pencil className="h-4 w-4" />}
                    />
                    <TableActionIconButton
                      label="Hapus pengumuman"
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => onDelete(announcement)}
                      icon={<Trash2 className="h-4 w-4" />}
                    />
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
