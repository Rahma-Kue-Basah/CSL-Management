"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryFilterCard } from "@/components/admin/inventory/inventory-filter-card";
import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import {
  EQUIPMENT_CATEGORY_OPTIONS,
  EQUIPMENT_STATUS_OPTIONS,
  MOVEABLE_OPTIONS,
} from "@/constants/equipments";
import { useEquipments } from "@/hooks/equipments/use-equipments";

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-600",
  borrowed: "bg-sky-500/10 text-sky-700",
  maintenance: "bg-amber-500/10 text-amber-700",
  broken: "bg-rose-500/10 text-rose-700",
  storage: "bg-slate-500/10 text-slate-600",
};

function formatStatus(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
}

export default function AdminEquipmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [moveable, setMoveable] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const { equipments, totalCount, isLoading, hasLoadedOnce, error } = useEquipments(
    page,
    PAGE_SIZE,
    {
      search: debouncedSearch,
      status,
      category,
      is_moveable: moveable,
    },
  );

  const totalEquipments = totalCount || equipments.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || equipments.length) / PAGE_SIZE)),
    [totalCount, equipments.length],
  );

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setCategory("");
    setMoveable("");
    setPage(1);
    setFilterOpen(false);
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">Inventarisasi Peralatan</h1>
          <p className="text-sm text-muted-foreground">Total {totalEquipments} peralatan terdaftar.</p>
        </div>
        <Button type="button" size="sm" disabled>
          <Plus className="h-4 w-4" />
          Tambah Peralatan
        </Button>
      </div>

      <InventoryFilterCard open={filterOpen} onToggle={() => setFilterOpen((prev) => !prev)} onReset={resetFilters}>
        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
          }}
        >
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sky-900/90">Cari</label>
            <Input
              type="search"
              value={search}
              placeholder="Nama atau kategori"
              className="border-sky-200 bg-white shadow-xs focus-visible:border-sky-400 focus-visible:ring-sky-200"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <SelectField
            label="Status"
            value={status}
            options={EQUIPMENT_STATUS_OPTIONS}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
          <SelectField
            label="Kategori"
            value={category}
            options={EQUIPMENT_CATEGORY_OPTIONS}
            onChange={(value) => {
              setCategory(value);
              setPage(1);
            }}
          />
          <SelectField
            label="Moveable"
            value={moveable}
            options={MOVEABLE_OPTIONS}
            onChange={(value) => {
              setMoveable(value);
              setPage(1);
            }}
          />
        </form>
      </InventoryFilterCard>

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="w-full max-w-full overflow-x-auto rounded border border-sky-100 bg-card">
        <table className="w-full min-w-[900px] table-fixed">
          <thead className="border-b border-sky-100 bg-sky-50">
            <tr className="text-left text-sm">
              <th className="w-[180px] px-3 py-3 font-medium text-sky-900">Nama</th>
              <th className="w-[140px] px-3 py-3 font-medium text-sky-900">Kategori</th>
              <th className="w-[120px] px-3 py-3 font-medium text-sky-900">Status</th>
              <th className="w-[90px] px-3 py-3 font-medium text-sky-900">Jumlah</th>
              <th className="w-[200px] px-3 py-3 font-medium text-sky-900">Ruangan</th>
              <th className="w-[120px] px-3 py-3 font-medium text-sky-900">Moveable</th>
              <th className="sticky right-0 z-10 relative w-[100px] bg-sky-50 px-3 py-3 text-center font-medium text-sky-900 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-sky-100">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading || !hasLoadedOnce ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </td>
              </tr>
            ) : equipments.length ? (
              equipments.map((item) => (
                <tr key={String(item.id)} className="border-b last:border-b-0">
                  <td className="truncate px-3 py-2 font-medium">{item.name}</td>
                  <td className="truncate px-3 py-2">{item.category}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[item.status] || "bg-muted text-muted-foreground"}`}>
                      {formatStatus(item.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="truncate px-3 py-2 text-muted-foreground">{item.roomName}</td>
                  <td className="px-3 py-2">{item.isMoveable ? "Ya" : "Tidak"}</td>
                  <td className="sticky right-0 z-10 bg-card px-3 py-2 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-sky-100">
                    <div className="flex justify-center">
                      <Button variant="outline" size="icon-sm" disabled>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Tidak ada data peralatan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InventoryPagination page={page} totalPages={totalPages} isLoading={isLoading} onPageChange={setPage} />
    </section>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sky-900/90">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-sky-200 bg-white px-2 text-sm outline-none shadow-xs focus-visible:border-sky-400 focus-visible:ring-[3px] focus-visible:ring-sky-200"
      >
        <option value="">Semua</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
