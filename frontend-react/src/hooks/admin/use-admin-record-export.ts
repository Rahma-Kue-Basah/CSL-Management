"use client";

import { useState } from "react";
import { toast } from "sonner";

import { fetchExportRecords } from "@/lib/admin/export-fetch";
import type { ExportColumn } from "@/lib/admin/export-config";

type UseAdminRecordExportOptions<TApiItem, TRow> = {
  endpoint: string;
  filters: Record<string, string>;
  mapItem: (item: TApiItem) => TRow;
  title: string;
  pdfFilename: string;
  excelFilename: string;
  columns: ExportColumn<TRow>[];
  emptyMessage: string;
  pdfSuccessMessage: string;
  excelSuccessMessage: string;
};

export function useAdminRecordExport<TApiItem, TRow>({
  endpoint,
  filters,
  mapItem,
  title,
  pdfFilename,
  excelFilename,
  columns,
  emptyMessage,
  pdfSuccessMessage,
  excelSuccessMessage,
}: UseAdminRecordExportOptions<TApiItem, TRow>) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const loadRows = async () => {
    const rows = await fetchExportRecords({
      endpoint,
      filters,
      mapItem,
    });

    if (!rows.length) {
      throw new Error(emptyMessage);
    }

    return rows;
  };

  const exportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const rows = await loadRows();
      const { exportAdminRecordPdf } = await import("@/lib/admin/export");
      await exportAdminRecordPdf({
        title,
        subtitle: `Total data: ${rows.length}`,
        filename: pdfFilename,
        columns,
        rows,
      });
      toast.success(pdfSuccessMessage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const exportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const rows = await loadRows();
      const { exportAdminRecordExcel } = await import("@/lib/admin/export");
      await exportAdminRecordExcel({
        title,
        filename: excelFilename,
        columns,
        rows,
      });
      toast.success(excelSuccessMessage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  return {
    exportPdf,
    exportExcel,
    isExportingPdf,
    isExportingExcel,
  };
}
