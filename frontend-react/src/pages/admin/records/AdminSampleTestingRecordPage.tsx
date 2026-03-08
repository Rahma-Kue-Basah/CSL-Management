"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, X } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InventoryFilterCard } from "@/components/admin/inventory/inventory-filter-card";
import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePengujians, type PengujianRow } from "@/hooks/pengujians/use-pengujians";
import { useIsMobile } from "@/hooks/use-mobile";

const PAGE_SIZE = 10;

type ActionType = "detail";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

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

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    case "completed":
      return "bg-sky-100 text-sky-700";
    case "cancelled":
      return "bg-slate-200 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [selectedItem, setSelectedItem] = useState<PengujianRow | null>(null);

  const isMobile = useIsMobile();
  const isActionOpen = Boolean(activeAction);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const { pengujians, totalCount, isLoading, hasLoadedOnce, error } = usePengujians(
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

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-4">
          <AdminPageHeader
            title="Record Pengujian Sampel"
            description="Pantau histori pengujian sampel yang diajukan pengguna."
            icon={<Eye className="h-5 w-5 text-sky-200" />}
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

          {error ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="w-full max-w-full overflow-x-auto rounded border border-slate-200 bg-card">
            <table className="w-full min-w-[1000px] table-fixed">
              <thead className="border-b border-slate-800 bg-slate-900">
                <tr className="text-left text-sm">
                  <th className="w-[140px] px-3 py-3 font-medium text-slate-50">
                    Kode
                  </th>
                  <th className="w-[220px] px-3 py-3 font-medium text-slate-50">
                    Pemohon
                  </th>
                  <th className="w-[220px] px-3 py-3 font-medium text-slate-50">
                    Institusi
                  </th>
                  <th className="w-[200px] px-3 py-3 font-medium text-slate-50">
                    Jenis Sampel
                  </th>
                  <th className="w-[140px] px-3 py-3 font-medium text-slate-50">
                    Status
                  </th>
                  <th className="sticky right-0 z-10 relative w-[120px] bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-700">
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
                      <td className="truncate px-3 py-2 font-medium">
                        {item.code}
                      </td>
                      <td className="truncate px-3 py-2">{item.name}</td>
                      <td className="truncate px-3 py-2 text-muted-foreground">
                        {item.institution || "-"}
                      </td>
                      <td className="truncate px-3 py-2">{item.sampleType}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(
                            item.status,
                          )}`}
                        >
                          {item.status || "-"}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 relative bg-card px-3 py-2 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setActiveAction("detail");
                            }}
                          >
                            <Eye className="h-4 w-4" />
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
        </div>

        {!isMobile && isActionOpen ? (
          <aside className="sticky top-0 hidden self-start w-full max-w-[380px] shrink-0 rounded border bg-card shadow-xs lg:block">
            <PengujianDetailPanel
              item={selectedItem}
              onClose={() => {
                setActiveAction(null);
                setSelectedItem(null);
              }}
            />
          </aside>
        ) : null}
      </div>

      <Sheet
        open={isMobile && isActionOpen}
        onOpenChange={(open) => {
          if (!open) {
            setActiveAction(null);
            setSelectedItem(null);
          }
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[92vw] p-0 sm:max-w-md [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]"
        >
          <PengujianDetailPanel
            item={selectedItem}
            onClose={() => {
              setActiveAction(null);
              setSelectedItem(null);
            }}
          />
        </SheetContent>
      </Sheet>
    </section>
  );
}

type PengujianDetailPanelProps = {
  item: PengujianRow | null;
  onClose: () => void;
};

function PengujianDetailPanel({ item, onClose }: PengujianDetailPanelProps) {
  if (!item) return null;

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Detail Pengujian
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {item.code}
          </h3>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm text-slate-700 shadow-xs">
        <div className="grid gap-3">
          <DetailRow label="Nama Pemohon" value={item.name} />
          <DetailRow label="Institusi" value={item.institution} />
          <DetailRow label="Email" value={item.email} />
          <DetailRow label="Telepon" value={item.phoneNumber} />
          <DetailRow label="Jenis Sampel" value={item.sampleType} />
          <DetailRow label="Bentuk Sampel" value={item.sampleShape} />
          <DetailRow label="Kondisi Sampel" value={item.sampleCondition} />
          <DetailRow label="Kemasan Sampel" value={item.samplePackaging} />
          <DetailRow label="Berat Sampel" value={item.sampleWeight} />
          <DetailRow label="Jumlah Sampel" value={item.sampleQuantity} />
          <DetailRow label="Penyajian Sampel" value={item.sampleTestingServing} />
          <DetailRow label="Metode Pengujian" value={item.sampleTestingMethod} />
          <DetailRow label="Jenis Pengujian" value={item.sampleTestingType} />
          <DetailRow label="Status" value={item.status} />
          <DetailRow label="Dibuat" value={formatDateTime(item.createdAt)} />
          <DetailRow label="Diupdate" value={formatDateTime(item.updatedAt)} />
          <DetailRow label="Disetujui Oleh" value={item.approvedByName} />
        </div>
      </div>
    </div>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-sm text-slate-700">{value || "-"}</span>
    </div>
  );
}
