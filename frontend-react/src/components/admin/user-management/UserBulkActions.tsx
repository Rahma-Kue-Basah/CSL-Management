"use client";

import { ChevronDown, Download, FileSpreadsheet, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserBulkActionsProps = {
  selectedCount: number;
  isDeleting: boolean;
  isExportingSelectedPdf: boolean;
  isExportingSelectedExcel: boolean;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onExportSelectedPdf: () => void;
  onExportSelectedExcel: () => void;
};

export default function UserBulkActions({
  selectedCount,
  isDeleting,
  isExportingSelectedPdf,
  isExportingSelectedExcel,
  onClearSelection,
  onDeleteSelected,
  onExportSelectedPdf,
  onExportSelectedExcel,
}: UserBulkActionsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={selectedCount === 0 || isDeleting}
          >
            Aksi Terpilih
            {selectedCount ? ` (${selectedCount})` : ""}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-48">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={selectedCount === 0 || isExportingSelectedPdf || isExportingSelectedExcel}>
              <Download className="h-4 w-4" />
              Export Terpilih
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              <DropdownMenuItem
                disabled={selectedCount === 0 || isExportingSelectedExcel}
                onClick={onExportSelectedExcel}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={selectedCount === 0 || isExportingSelectedPdf}
                onClick={onExportSelectedPdf}
              >
                <Download className="h-4 w-4" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={selectedCount === 0 || isDeleting}
            onClick={onDeleteSelected}
          >
            <Trash2 className="h-4 w-4" />
            Hapus Terpilih
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={selectedCount === 0}
            onClick={onClearSelection}
            className="text-xs text-slate-500"
          >
            <X className="h-3.5 w-3.5" />
            Clear selection
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
