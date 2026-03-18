"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import AdminRecordExportActions from "@/components/admin/records/AdminRecordExportActions";
import AdminRecordSummaryCards from "@/components/admin/records/AdminRecordSummaryCards";
import RecordDeleteDialog from "@/components/admin/records/RecordDeleteDialog";
import { InventoryFilterCard } from "@/components/admin/inventory/inventory-filter-card";
import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_PENGUJIAN_DETAIL, API_PENGUJIANS_EXPORT } from "@/constants/api";
import {
  mapPengujian,
  usePengujians,
  type PengujianRow,
} from "@/hooks/pengujians/use-pengujians";
import { useDeleteRecord } from "@/hooks/use-delete-record";
import { PENGUJIAN_EXPORT_COLUMNS } from "@/lib/admin-record-export-config";
import {
  getStatusBadgeClass,
  getStatusDisplayLabel,
  SAMPLE_TESTING_STATUS_OPTIONS,
} from "@/lib/status";
import { useAdminRecordExport } from "@/hooks/admin/use-admin-record-export";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = SAMPLE_TESTING_STATUS_OPTIONS;

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

function matchesSearch(row: PengujianRow, query: string) {
  if (!query) return true;
  const haystack = [
    row.code,
    row.name,
    row.institution,
    row.email,
    row.sampleType,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function AdminRecordPengujianSampelPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<PengujianRow | null>(null);
  const { deleteRecord, isDeleting } = useDeleteRecord();
  const {
    exportPdf,
    exportExcel,
    isExportingPdf,
    isExportingExcel,
  } = useAdminRecordExport({
    endpoint: API_PENGUJIANS_EXPORT,
    filters: { q: debouncedSearch, status },
    mapItem: mapPengujian,
    title: "Record Pengujian Sampel",
    pdfFilename: "record-pengujian-sampel.pdf",
    excelFilename: "record-pengujian-sampel.xlsx",
    columns: PENGUJIAN_EXPORT_COLUMNS,
    emptyMessage: "Tidak ada data pengujian sampel untuk diunduh.",
    pdfSuccessMessage: "PDF pengujian sampel berhasil diunduh.",
    excelSuccessMessage: "Excel pengujian sampel berhasil diunduh.",
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const { pengujians, totalCount, aggregates, isLoading, hasLoadedOnce, error } = usePengujians(
    page,
    PAGE_SIZE,
    {
      status,
    },
    reloadKey,
  );

  const filteredItems = useMemo(
    () => pengujians.filter((item) => matchesSearch(item, debouncedSearch)),
    [pengujians, debouncedSearch],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || filteredItems.length) / PAGE_SIZE)),
    [totalCount, filteredItems.length],
  );

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setPage(1);
    setFilterOpen(false);
    setReloadKey((prev) => prev + 1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteRecord(API_PENGUJIAN_DETAIL(deleteTarget.id));
    if (result.ok) {
      toast.success("Record pengujian sampel berhasil dihapus.");
      setDeleteTarget(null);
      setReloadKey((prev) => prev + 1);
      return;
    }
    toast.error(result.message);
  };

  return (
    <section className="w-full min-w-0 space-y-4 px-4 pb-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-4">
          <AdminPageHeader
            title="Record Pengujian Sampel"
            description="Pantau histori pengujian sampel yang diajukan pengguna."
            icon={<Eye className="h-5 w-5 text-sky-200" />}
          />

          <AdminRecordSummaryCards
            items={[
              { label: "Total", value: aggregates.total, tone: "blue" },
              { label: "Pending", value: aggregates.pending },
              { label: "Approved", value: aggregates.approved },
              { label: "Completed", value: aggregates.completed },
              { label: "Rejected", value: aggregates.rejected },
            ]}
          />

          <InventoryFilterCard
            open={filterOpen}
            onToggle={() => setFilterOpen((prev) => !prev)}
            onReset={resetFilters}
          >
            <form
              className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
              }}
            >
              <div className="min-w-0 md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Cari
                </label>
                <Input
                  type="search"
                  value={search}
                  placeholder="Kode, nama pemohon, institusi, atau jenis sampel"
                  className="border-slate-400 bg-white shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-md border border-slate-400 bg-white px-2 text-sm outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </InventoryFilterCard>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Export mengikuti filter dan pencarian yang sedang aktif.
            </p>
            <AdminRecordExportActions
              onExportExcel={exportExcel}
              onExportPdf={exportPdf}
              isExportingExcel={isExportingExcel}
              isExportingPdf={isExportingPdf}
            />
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="w-full min-w-0 overflow-x-auto rounded border border-slate-200 bg-card [scrollbar-width:thin]">
            <table className="min-w-max w-full table-auto">
              <thead className="border-b border-slate-800 bg-slate-900">
                <tr className="text-left text-sm">
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Kode
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Pemohon
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Institusi
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Jenis Sampel
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">
                    Status
                  </th>
                  <th className="sticky right-0 z-10 relative whitespace-nowrap bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading || !hasLoadedOnce ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length ? (
                  filteredItems.map((item) => (
                    <tr key={String(item.id)} className="border-b last:border-b-0">
                      <td className="whitespace-nowrap px-3 py-2 font-medium">
                        {item.code}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{item.name}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {item.institution || "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{item.sampleType}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(
                            item.status,
                          )}`}
                        >
                          {getStatusDisplayLabel(item.status)}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 relative bg-card px-3 py-2 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              navigate(`/admin/records/sample-testing/${item.id}`, {
                                state: { from: location.pathname },
                              });
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      Tidak ada data pengujian sampel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <InventoryPagination
            page={page}
            totalPages={totalPages}
            isLoading={isLoading}
            onPageChange={setPage}
          />

          <RecordDeleteDialog
            open={Boolean(deleteTarget)}
            title="Hapus record pengujian sampel?"
            description={`Record ${deleteTarget?.code ?? ""} akan dihapus permanen.`}
            isDeleting={isDeleting}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            onConfirm={handleDelete}
          />
        </div>
      </div>
    </section>
  );
}
