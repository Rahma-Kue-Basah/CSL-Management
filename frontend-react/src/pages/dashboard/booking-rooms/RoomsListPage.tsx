"use client";

import { useState } from "react";
import { Eye, Filter, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRooms } from "@/hooks/rooms/use-rooms";

const PAGE_SIZE = 10;
const FLOOR_OPTIONS = [
  { value: "", label: "Semua Lantai" },
  { value: "1", label: "Lantai 1" },
  { value: "2", label: "Lantai 2" },
  { value: "3", label: "Lantai 3" },
  { value: "4", label: "Lantai 4" },
  { value: "5", label: "Lantai 5" },
];

export default function RoomsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [floor, setFloor] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const { rooms, totalCount, isLoading, hasLoadedOnce, error } = useRooms(page, PAGE_SIZE, {
    search: search.trim(),
    floor,
  });

  const totalPages = Math.max(1, Math.ceil((totalCount || rooms.length) / PAGE_SIZE));
  const resetFilters = () => {
    setSearch("");
    setFloor("");
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
            Filter Ruangan
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Cari
                </label>
                <Input
                  type="search"
                  value={search}
                  placeholder="Nama ruangan atau nomor"
                  className="h-11 border-slate-300 bg-white px-3 shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Lantai
                </label>
                <select
                  value={floor}
                  onChange={(event) => {
                    setFloor(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                >
                  {FLOOR_OPTIONS.map((option) => (
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
        <table className="w-full min-w-[860px] table-fixed">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr className="text-left text-sm">
              <th className="w-[200px] px-3 py-3 font-medium text-slate-50">Nama Ruangan</th>
              <th className="w-[130px] px-3 py-3 font-medium text-slate-50">Nomor</th>
              <th className="w-[100px] px-3 py-3 font-medium text-slate-50">Lantai</th>
              <th className="w-[120px] px-3 py-3 font-medium text-slate-50">Kapasitas</th>
              <th className="w-[200px] px-3 py-3 font-medium text-slate-50">PIC</th>
              <th className="w-[250px] px-3 py-3 font-medium text-slate-50">Deskripsi</th>
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
            ) : rooms.length ? (
              rooms.map((room) => (
                <tr key={String(room.id)} className="border-b last:border-b-0">
                  <td className="truncate px-3 py-2.5 font-medium text-slate-800">{room.name}</td>
                  <td className="truncate px-3 py-2.5">{room.number}</td>
                  <td className="truncate px-3 py-2.5">{room.floor}</td>
                  <td className="truncate px-3 py-2.5">{room.capacity}</td>
                  <td className="truncate px-3 py-2.5">{room.picName}</td>
                  <td className="truncate px-3 py-2.5">{room.description || "-"}</td>
                  <td className="sticky right-0 z-10 bg-white px-3 py-2.5 text-center shadow-[-1px_0_0_0_rgba(226,232,240,1)]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-slate-300 text-slate-700"
                      onClick={() => router.push(`/rooms/${room.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                  Belum ada ruangan yang tersedia.
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
