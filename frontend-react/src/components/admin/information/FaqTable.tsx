"use client";

import type { RefObject } from "react";
import { Image as AntdImage } from "antd";
import { Eye, Loader2, Pencil, Trash2 } from "lucide-react";

import { TableActionIconButton } from "@/components/shared";
import type { Faq } from "@/hooks/information/faq";
import { formatDateTimeId } from "@/lib/date";
import { summarizeText } from "@/lib/text";

type FaqTableProps = {
  faqs: Faq[];
  isLoading: boolean;
  emptyMessage?: string;
  selectedIds: Array<string | number>;
  allVisibleSelected: boolean;
  selectAllRef: RefObject<HTMLInputElement | null>;
  onToggleSelectAllVisible: (checked: boolean) => void;
  onToggleItemSelection: (faq: Faq) => void;
  onView: (faq: Faq) => void;
  onEdit: (faq: Faq) => void;
  onDelete: (faq: Faq) => void;
};

export default function FaqTable({
  faqs,
  isLoading,
  emptyMessage = "Tidak ada data FAQ.",
  selectedIds,
  allVisibleSelected,
  selectAllRef,
  onToggleSelectAllVisible,
  onToggleItemSelection,
  onView,
  onEdit,
  onDelete,
}: FaqTableProps) {
  return (
    <div className="w-full min-w-0 overflow-x-auto rounded border border-slate-200 bg-card [scrollbar-width:thin]">
      <table className="w-full min-w-[988px] table-fixed">
        <thead className="border-b border-slate-800 bg-slate-900">
          <tr className="text-left text-sm">
            <th className="w-12 px-3 py-3 text-center font-medium text-slate-50">
              <input
                ref={selectAllRef}
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 align-middle"
                checked={allVisibleSelected}
                onChange={(event) => onToggleSelectAllVisible(event.target.checked)}
                aria-label="Pilih semua FAQ yang tampil"
              />
            </th>
            <th className="w-[280px] px-3 py-3 font-medium text-slate-50">
              Pertanyaan
            </th>
            <th className="w-[124px] px-3 py-3 font-medium text-slate-50">
              Gambar
            </th>
            <th className="w-[500px] px-3 py-3 font-medium text-slate-50">
              Jawaban
            </th>
            <th className="w-[120px] px-3 py-3 font-medium text-slate-50">
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
              <td colSpan={6} className="px-3 py-8 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </td>
            </tr>
          ) : faqs.length ? (
            faqs.map((item) => (
              <tr key={String(item.id)} className="border-b last:border-b-0">
                <td className="px-3 py-2 text-center align-top">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 align-middle"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => onToggleItemSelection(item)}
                    aria-label={`Pilih FAQ ${item.question}`}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="whitespace-normal break-words font-medium text-slate-900">
                    {summarizeText(item.question, 180)}
                  </div>
                </td>
                <td className="px-3 py-2 align-top">
                  {item.imageUrl ? (
                    <AntdImage
                      src={item.imageUrl}
                      alt={item.question}
                      width={96}
                      height={64}
                      className="rounded-md border border-slate-200 object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="whitespace-normal break-words text-muted-foreground">
                    {summarizeText(item.answer, 320)}
                  </div>
                </td>
                <td className="px-3 py-2 align-top text-muted-foreground">
                  {formatDateTimeId(item.created_at)}
                </td>
                <td className="sticky right-0 z-10 relative bg-card px-3 py-2 align-top shadow-[-6px_0_10px_-10px_rgba(15,23,42,0.18)] before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                  <div className="flex justify-center gap-2">
                    <TableActionIconButton
                      label="Lihat detail"
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onView(item)}
                      icon={<Eye className="h-4 w-4" />}
                    />
                    <TableActionIconButton
                      label="Edit FAQ"
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onEdit(item)}
                      icon={<Pencil className="h-4 w-4" />}
                    />
                    <TableActionIconButton
                      label="Hapus FAQ"
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => onDelete(item)}
                      icon={<Trash2 className="h-4 w-4" />}
                    />
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
