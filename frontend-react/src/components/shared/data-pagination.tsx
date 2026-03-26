"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type DataPaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  itemLabel: string;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
};

export function DataPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  itemLabel,
  isLoading = false,
  onPageChange,
}: DataPaginationProps) {
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);
  const visiblePages = Array.from(
    { length: end - start + 1 },
    (_, idx) => start + idx,
  );
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-1">
        <div className="px-2.5 py-1 text-sm text-slate-600">
          Menampilkan <span className="text-slate-900">{startItem}-{endItem}</span>{" "}
          dari <span className="text-slate-900">{totalCount}</span> {itemLabel}
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="px-2.5 py-1 text-sm text-slate-600">
          Halaman <span className="text-slate-900">{page}</span> /{" "}
          <span className="text-slate-900">{totalPages}</span>
        </div>
      </div>
      <div className="flex w-fit max-w-full self-start flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(1)}
          aria-label="Halaman pertama"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {visiblePages.map((pageNumber) => (
          <Button
            key={pageNumber}
            type="button"
            variant={pageNumber === page ? "default" : "ghost"}
            size="sm"
            className="min-w-8 px-2"
            disabled={isLoading}
            onClick={() => onPageChange(pageNumber)}
            aria-label={`Halaman ${pageNumber}`}
          >
            {pageNumber}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page < totalPages ? page + 1 : page)}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(totalPages)}
          aria-label="Halaman terakhir"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default DataPagination;
