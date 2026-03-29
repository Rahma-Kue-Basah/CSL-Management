"use client";

import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminHistoryExportActionsProps = {
  onExportExcel: () => void;
  onExportPdf: () => void;
  isExportingExcel: boolean;
  isExportingPdf: boolean;
};

export default function AdminHistoryExportActions({
  onExportExcel,
  onExportPdf,
  isExportingExcel,
  isExportingPdf,
}: AdminHistoryExportActionsProps) {
  const isExporting = isExportingExcel || isExportingPdf;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 cursor-pointer gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-44">
        <DropdownMenuItem onSelect={onExportPdf} disabled={isExportingPdf}>
          <FileText className="h-4 w-4" />
          Export PDF
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExportExcel} disabled={isExportingExcel}>
          <FileSpreadsheet className="h-4 w-4" />
          Export Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
