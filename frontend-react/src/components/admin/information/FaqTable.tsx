"use client";

import type { RefObject } from "react";
import { Eye, Loader2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Faq } from "@/hooks/faqs/use-faqs";

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

function summarizeText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "-";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

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
              <td colSpan={5} className="px-3 py-8 text-center">
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
                  <div className="whitespace-normal break-words text-muted-foreground">
                    {summarizeText(item.answer, 320)}
                  </div>
                </td>
                <td className="px-3 py-2 align-top text-muted-foreground">
                  {formatDateTime(item.created_at)}
                </td>
                <td className="sticky right-0 z-10 relative bg-card px-3 py-2 align-top shadow-[-6px_0_10px_-10px_rgba(15,23,42,0.18)] before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                  <div className="flex justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onView(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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
