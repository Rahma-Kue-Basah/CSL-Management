"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryFilterCard } from "@/components/admin/inventory/inventory-filter-card";
import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { useRooms } from "@/hooks/rooms/use-rooms";

const PAGE_SIZE = 10;

export default function AdminRoomsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [floor, setFloor] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const { rooms, totalCount, isLoading, hasLoadedOnce, error } = useRooms(page, PAGE_SIZE, {
    floor,
    search: debouncedSearch,
  });

  const totalRooms = totalCount || rooms.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || rooms.length) / PAGE_SIZE)),
    [totalCount, rooms.length],
  );

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setFloor("");
    setPage(1);
    setFilterOpen(false);
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">Inventarisasi Ruangan</h1>
          <p className="text-sm text-muted-foreground">Total {totalRooms} ruangan terdaftar.</p>
        </div>
        <Button type="button" size="sm" disabled>
          <Plus className="h-4 w-4" />
          Tambah Ruangan
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
              placeholder="Nama ruangan atau nomor"
              className="border-sky-200 bg-white shadow-xs focus-visible:border-sky-400 focus-visible:ring-sky-200"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sky-900/90">Lantai</label>
            <Input
              type="number"
              value={floor}
              placeholder="Semua"
              className="border-sky-200 bg-white shadow-xs focus-visible:border-sky-400 focus-visible:ring-sky-200"
              onChange={(event) => {
                setFloor(event.target.value);
                setPage(1);
              }}
            />
          </div>
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
              <th className="w-[120px] px-3 py-3 font-medium text-sky-900">No. Ruang</th>
              <th className="w-[90px] px-3 py-3 font-medium text-sky-900">Lantai</th>
              <th className="w-[120px] px-3 py-3 font-medium text-sky-900">Kapasitas</th>
              <th className="w-[220px] px-3 py-3 font-medium text-sky-900">Deskripsi</th>
              <th className="w-[220px] px-3 py-3 font-medium text-sky-900">PIC</th>
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
            ) : rooms.length ? (
              rooms.map((room) => (
                <tr key={String(room.id)} className="border-b last:border-b-0">
                  <td className="truncate px-3 py-2 font-medium">{room.name}</td>
                  <td className="truncate px-3 py-2">{room.number}</td>
                  <td className="px-3 py-2">{room.floor}</td>
                  <td className="px-3 py-2">{room.capacity}</td>
                  <td className="px-3 py-2">{room.description || "-"}</td>
                  <td className="truncate px-3 py-2 text-muted-foreground">{room.picName}</td>
                  <td className="sticky right-0 z-10 relative bg-card px-3 py-2 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-sky-100">
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
                  Tidak ada data ruangan.
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
