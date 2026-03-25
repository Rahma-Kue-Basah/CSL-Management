"use client";

import { ChevronDown, Download, FileSpreadsheet, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type InventoryBulkActionsProps = {
  selectedCount: number;
  isDeleting: boolean;
  isExportingSelectedPdf: boolean;
  isExportingSelectedExcel: boolean;
  onDeleteSelected: () => void;
  onExportSelectedPdf: () => void;
  onExportSelectedExcel: () => void;
};

export default function InventoryBulkActions({
  selectedCount,
  isDeleting,
  isExportingSelectedPdf,
  isExportingSelectedExcel,
  onDeleteSelected,
  onExportSelectedPdf,
  onExportSelectedExcel,
}: InventoryBulkActionsProps) {
  return (
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
        <DropdownMenuItem
          variant="destructive"
          disabled={selectedCount === 0 || isDeleting}
          onClick={onDeleteSelected}
        >
          <Trash2 className="h-4 w-4" />
          Hapus Terpilih
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
