"use client";

import { useState } from "react";
import { Eye, Filter, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EQUIPMENT_CATEGORY_OPTIONS,
  EQUIPMENT_STATUS_OPTIONS,
  MOVEABLE_OPTIONS,
} from "@/constants/equipments";
import { useEquipments } from "@/hooks/equipments/use-equipments";
import { useRoomOptions } from "@/hooks/rooms/use-room-options";

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

export default function EquipmentListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [room, setRoom] = useState("");
  const [moveable, setMoveable] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const { rooms: filterRooms, isLoading: isLoadingFilterRooms } = useRoomOptions();
  const { equipments, totalCount, isLoading, hasLoadedOnce, error } = useEquipments(page, PAGE_SIZE, {
    search: search.trim(),
    status,
    category,
    room,
    is_moveable: moveable,
  });

  const totalPages = Math.max(1, Math.ceil((totalCount || equipments.length) / PAGE_SIZE));

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setCategory("");
    setRoom("");
    setMoveable("");
    setPage(1);
    setFilterOpen(false);
  };

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/80">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-slate-800"
            onClick={() => setFilterOpen((prev) => !prev)}
          >
            <span className="rounded-md bg-white p-1.5 text-slate-600 shadow-xs">
              <Filter className="h-4 w-4" />
            </span>
            Filter Peralatan
          </button>
          {filterOpen ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={resetFilters}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          ) : null}
        </div>

        {filterOpen ? (
          <div className="border-t border-slate-200/80 bg-white px-4 pb-4 pt-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Cari
                </label>
                <Input
                  type="search"
                  value={search}
                  placeholder="Nama atau kategori"
                  className="h-11 border-slate-300 bg-white px-3 shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
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
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                >
                  <option value="">Semua Status</option>
                  {EQUIPMENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                >
                  <option value="">Semua Kategori</option>
                  {EQUIPMENT_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Ruangan
                </label>
                <select
                  value={room}
                  onChange={(event) => {
                    setRoom(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                  disabled={isLoadingFilterRooms}
                >
                  <option value="">
                    {isLoadingFilterRooms ? "Memuat ruangan..." : "Semua Ruangan"}
                  </option>
                  {filterRooms.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Moveable
                </label>
                <select
                  value={moveable}
                  onChange={(event) => {
                    setMoveable(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                >
                  <option value="">Semua</option>
                  {MOVEABLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[960px] table-fixed">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr className="text-left text-sm">
              <th className="w-[180px] px-3 py-3 font-medium text-slate-50">Nama</th>
              <th className="w-[140px] px-3 py-3 font-medium text-slate-50">Kategori</th>
              <th className="w-[120px] px-3 py-3 font-medium text-slate-50">Status</th>
              <th className="w-[90px] px-3 py-3 font-medium text-slate-50">Jumlah</th>
              <th className="w-[200px] px-3 py-3 font-medium text-slate-50">Ruangan</th>
              <th className="w-[120px] px-3 py-3 font-medium text-slate-50">Moveable</th>
              <th className="sticky right-0 z-20 w-[120px] bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 shadow-[-1px_0_0_0_rgba(51,65,85,1)]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading || !hasLoadedOnce ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data...
                  </div>
                </td>
              </tr>
            ) : equipments.length ? (
              equipments.map((item) => (
                <tr key={String(item.id)} className="border-b last:border-b-0">
                  <td className="truncate px-3 py-2.5 font-medium text-slate-800">{item.name}</td>
                  <td className="truncate px-3 py-2.5">{item.category}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[item.status] || "bg-slate-500/10 text-slate-600"}`}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </td>
                  <td className="truncate px-3 py-2.5">{item.quantity}</td>
                  <td className="truncate px-3 py-2.5">{item.roomName}</td>
                  <td className="truncate px-3 py-2.5">{item.isMoveable ? "Ya" : "Tidak"}</td>
                  <td className="sticky right-0 z-10 bg-white px-3 py-2.5 text-center shadow-[-1px_0_0_0_rgba(226,232,240,1)]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-slate-300 text-slate-700"
                      onClick={() => router.push(`/equipment/${item.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                  Belum ada peralatan yang tersedia.
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
    </section>
  );
}
