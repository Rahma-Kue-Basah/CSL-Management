import type { ReactNode, RefObject } from "react";
import { Loader2 } from "lucide-react";

type AdminRecordTableColumn = {
  label: string;
  className?: string;
};

type AdminRecordTableProps = {
  columns: AdminRecordTableColumn[];
  colSpan: number;
  hasRows: boolean;
  isLoading: boolean;
  hasLoadedOnce: boolean;
  emptyMessage: string;
  allVisibleSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  selectAllRef?: RefObject<HTMLInputElement | null>;
  selectAllAriaLabel?: string;
  children: ReactNode;
};

export default function AdminRecordTable({
  columns,
  colSpan,
  hasRows,
  isLoading,
  hasLoadedOnce,
  emptyMessage,
  allVisibleSelected,
  onToggleSelectAll,
  selectAllRef,
  selectAllAriaLabel = "Pilih semua record pada halaman ini",
  children,
}: AdminRecordTableProps) {
  return (
    <div className="w-full min-w-0 overflow-x-auto rounded border border-slate-200 bg-card [scrollbar-width:thin]">
      <table className="min-w-max w-full table-auto">
        <thead className="border-b border-slate-800 bg-slate-900">
          <tr className="text-left text-sm">
            <th className="w-12 px-3 py-3 text-center font-medium text-slate-50">
              <input
                ref={selectAllRef}
                type="checkbox"
                aria-label={selectAllAriaLabel}
                className="h-4 w-4 rounded border-slate-300 align-middle"
                checked={allVisibleSelected}
                onChange={(event) => onToggleSelectAll(event.target.checked)}
              />
            </th>
            {columns.map((column) => (
              <th
                key={column.label}
                className={column.className ?? "whitespace-nowrap px-3 py-3 font-medium text-slate-50"}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm">
          {isLoading || !hasLoadedOnce ? (
            <tr>
              <td colSpan={colSpan} className="px-3 py-8 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </td>
            </tr>
          ) : hasRows ? (
            children
          ) : (
            <tr>
              <td
                colSpan={colSpan}
                className="px-3 py-6 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
