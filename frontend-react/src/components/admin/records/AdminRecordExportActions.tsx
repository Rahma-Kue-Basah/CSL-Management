"use client";

import { Download, FileSpreadsheet, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type AdminRecordExportActionsProps = {
  onExportExcel: () => void;
  onExportPdf: () => void;
  isExportingExcel: boolean;
  isExportingPdf: boolean;
};

export default function AdminRecordExportActions({
  onExportExcel,
  onExportPdf,
  isExportingExcel,
  isExportingPdf,
}: AdminRecordExportActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 cursor-pointer gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        onClick={onExportExcel}
        disabled={isExportingExcel}
      >
        {isExportingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Export Excel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 cursor-pointer gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        onClick={onExportPdf}
        disabled={isExportingPdf}
      >
        {isExportingPdf ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Export PDF
      </Button>
    </div>
  );
}
