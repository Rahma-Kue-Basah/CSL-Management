"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFilterCard } from "@/components/admin/admin-filter-card";
import InventoryBulkActions from "@/components/admin/inventory/InventoryBulkActions";
import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import AdminRoomDetailDialog from "@/components/admin/inventory/AdminRoomDetailDialog";
import RoomCreateDialog from "@/components/admin/inventory/RoomCreateDialog";
import RoomTable from "@/components/admin/inventory/RoomTable";
import AdminRecordExportActions from "@/components/admin/records/AdminRecordExportActions";
import RecordDeleteDialog from "@/components/admin/records/RecordDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_ROOMS_EXPORT } from "@/constants/api";
import { useAdminRecordExport } from "@/hooks/admin/use-admin-record-export";
import { useDeleteRoom } from "@/hooks/rooms/use-delete-room";
import { mapRoom, useRooms, type RoomRow } from "@/hooks/rooms/use-rooms";
import { usePicUsers } from "@/hooks/users/use-pic-users";
import { ROOM_EXPORT_COLUMNS } from "@/lib/admin-record-export-config";
import { exportAdminRecordExcel, exportAdminRecordPdf } from "@/lib/admin-record-pdf";

const PAGE_SIZE = 20;

export default function AdminRoomsPage() {
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [floor, setFloor] = useState("");
  const [pic, setPic] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailRoom, setDetailRoom] = useState<RoomRow | null>(null);
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");
  const [deleteCandidate, setDeleteCandidate] = useState<RoomRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isExportingSelectedPdf, setIsExportingSelectedPdf] = useState(false);
  const [isExportingSelectedExcel, setIsExportingSelectedExcel] = useState(false);

  const { picUsers: filterPicUsers, isLoading: isLoadingFilterPics } = usePicUsers();
  const {
    deleteRoom,
    deleteRooms,
    isDeleting,
  } = useDeleteRoom();

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const { rooms, totalCount, isLoading, hasLoadedOnce, error } = useRooms(
    page,
    PAGE_SIZE,
    {
      floor,
      pic,
      search: debouncedSearch,
    },
    reloadKey,
  );

  const totalRooms = totalCount || rooms.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || rooms.length) / PAGE_SIZE)),
    [totalCount, rooms.length],
  );

  const selectedCount = selectedIds.length;
  const selectedRows = useMemo(
    () => rooms.filter((room) => selectedIds.some((id) => String(id) === String(room.id))),
    [rooms, selectedIds],
  );

  const allVisibleSelected =
    rooms.length > 0 && rooms.every((room) => selectedIds.includes(room.id));
  const someVisibleSelected =
    rooms.some((room) => selectedIds.includes(room.id)) && !allVisibleSelected;

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => rooms.some((room) => String(room.id) === String(id))),
    );
  }, [rooms]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  const { exportPdf, exportExcel, isExportingPdf, isExportingExcel } = useAdminRecordExport({
    endpoint: API_ROOMS_EXPORT,
    filters: {
      floor,
      pic,
      q: debouncedSearch,
    },
    mapItem: mapRoom,
    title: "Inventarisasi Ruangan",
    pdfFilename: "inventarisasi-ruangan.pdf",
    excelFilename: "inventarisasi-ruangan.xlsx",
    columns: ROOM_EXPORT_COLUMNS,
    emptyMessage: "Tidak ada data ruangan untuk diunduh.",
    pdfSuccessMessage: "PDF ruangan berhasil diunduh.",
    excelSuccessMessage: "Excel ruangan berhasil diunduh.",
  });

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setFloor("");
    setPic("");
    setPage(1);
    setFilterOpen(false);
  };

  const handleCreated = () => {
    setReloadKey((prev) => prev + 1);
    setPage(1);
  };

  const handleDelete = async (room: RoomRow) => {
    const result = await deleteRoom(room.id);
    if (!result.ok) return;

    setDeleteCandidate(null);
    setSelectedIds((prev) => prev.filter((id) => String(id) !== String(room.id)));
    setReloadKey((prev) => prev + 1);
    toast.success("Ruangan berhasil dihapus.");
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;

    const result = await deleteRooms(selectedIds);
    if (!result.ok) {
      toast.error(result.message || "Gagal menghapus ruangan terpilih.");
      return;
    }

    const removedIds = new Set((result.deletedIds ?? []).map((id) => String(id)));
    setSelectedIds((prev) => prev.filter((id) => !removedIds.has(String(id))));
    setIsBulkDeleteOpen(false);
    setReloadKey((prev) => prev + 1);

    if ((result.failedCount ?? 0) > 0) {
      toast.warning(
        `${result.deletedCount ?? 0} ruangan berhasil dihapus, ${result.failedCount ?? 0} gagal.`,
      );
      return;
    }

    toast.success(`${result.deletedCount ?? 0} ruangan berhasil dihapus.`);
  };

  const handleExportSelectedPdf = async () => {
    try {
      setIsExportingSelectedPdf(true);
      if (!selectedRows.length) {
        throw new Error("Pilih minimal satu ruangan untuk diunduh.");
      }
      exportAdminRecordPdf({
        title: "Inventarisasi Ruangan",
        subtitle: `Total data: ${selectedRows.length}`,
        filename: "inventarisasi-ruangan-selected.pdf",
        columns: ROOM_EXPORT_COLUMNS,
        rows: selectedRows,
      });
      toast.success("PDF ruangan terpilih berhasil diunduh.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh PDF.");
    } finally {
      setIsExportingSelectedPdf(false);
    }
  };

  const handleExportSelectedExcel = async () => {
    try {
      setIsExportingSelectedExcel(true);
      if (!selectedRows.length) {
        throw new Error("Pilih minimal satu ruangan untuk diunduh.");
      }
      exportAdminRecordExcel({
        title: "Inventarisasi Ruangan",
        filename: "inventarisasi-ruangan-selected.xlsx",
        columns: ROOM_EXPORT_COLUMNS,
        rows: selectedRows,
      });
      toast.success("Excel ruangan terpilih berhasil diunduh.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh Excel.");
    } finally {
      setIsExportingSelectedExcel(false);
    }
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full min-w-0 space-y-4">
          <AdminPageHeader
            title="Inventarisasi Ruangan"
            description={`Total ${totalRooms} ruangan terdaftar.`}
            icon={<Plus className="h-5 w-5 text-sky-200" />}
          />

          <AdminFilterCard
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
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-slate-900/90">
                  Cari
                </label>
                <Input
                  type="search"
                  value={search}
                  placeholder="Nama ruangan atau nomor"
                  className="border-slate-400 bg-white shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-slate-900/90">
                  Lantai
                </label>
                <Input
                  type="number"
                  value={floor}
                  placeholder="Semua"
                  className="border-slate-400 bg-white shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
                  onChange={(event) => {
                    setFloor(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-slate-900/90">
                  PIC
                </label>
                <select
                  value={pic}
                  onChange={(event) => {
                    setPic(event.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-md border border-slate-400 bg-white px-2 text-sm outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                  disabled={isLoadingFilterPics}
                >
                  <option value="">{isLoadingFilterPics ? "Memuat PIC..." : "Semua PIC"}</option>
                  {filterPicUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </AdminFilterCard>

          {error ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <InventoryBulkActions
              selectedCount={selectedCount}
              isDeleting={isDeleting}
              isExportingSelectedPdf={isExportingSelectedPdf}
              isExportingSelectedExcel={isExportingSelectedExcel}
              onDeleteSelected={() => setIsBulkDeleteOpen(true)}
              onExportSelectedPdf={() => {
                void handleExportSelectedPdf();
              }}
              onExportSelectedExcel={() => {
                void handleExportSelectedExcel();
              }}
            />
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-end">
              <p className="text-xs text-muted-foreground sm:text-right">
                Export mengikuti filter dan pencarian yang sedang aktif.
              </p>
              <AdminRecordExportActions
                onExportExcel={() => {
                  void exportExcel();
                }}
                onExportPdf={() => {
                  void exportPdf();
                }}
                isExportingExcel={isExportingExcel}
                isExportingPdf={isExportingPdf}
              />
              <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Tambah Ruangan
              </Button>
            </div>
          </div>

          <RoomTable
            rooms={rooms}
            isLoading={isLoading}
            hasLoadedOnce={hasLoadedOnce}
            selectedIds={selectedIds}
            allVisibleSelected={allVisibleSelected}
            isDeleting={isDeleting}
            deleteCandidate={deleteCandidate}
            selectAllRef={selectAllRef}
            onToggleSelectAllVisible={(checked) => {
              if (!checked) {
                setSelectedIds((prev) =>
                  prev.filter((id) => !rooms.some((room) => String(room.id) === String(id))),
                );
                return;
              }
              setSelectedIds((prev) => {
                const next = new Set(prev);
                rooms.forEach((room) => next.add(room.id));
                return Array.from(next);
              });
            }}
            onToggleItemSelection={(room) => {
              setSelectedIds((prev) =>
                prev.includes(room.id)
                  ? prev.filter((itemId) => itemId !== room.id)
                  : [...prev, room.id],
              );
            }}
            onOpenDetail={(room, mode) => {
              setDetailMode(mode);
              setDetailRoom(room);
            }}
            onDeleteCandidateChange={setDeleteCandidate}
            onDelete={handleDelete}
          />

          <InventoryPagination
            page={page}
            totalPages={totalPages}
            isLoading={isLoading}
            onPageChange={setPage}
          />
        </div>
      </div>

      <RoomCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      <RecordDeleteDialog
        open={isBulkDeleteOpen}
        title="Hapus ruangan terpilih?"
        description={`${selectedCount} ruangan yang dipilih akan dihapus permanen.`}
        isDeleting={isDeleting}
        onOpenChange={setIsBulkDeleteOpen}
        onConfirm={() => {
          void handleBulkDelete();
        }}
      />

      <AdminRoomDetailDialog
        open={Boolean(detailRoom)}
        room={detailRoom}
        initialMode={detailMode}
        onOpenChange={(open) => {
          if (!open) {
            setDetailRoom(null);
            setDetailMode("view");
          }
        }}
        onUpdated={() => setReloadKey((prev) => prev + 1)}
        onDeleted={() => {
          setDetailRoom(null);
          setDetailMode("view");
          setReloadKey((prev) => prev + 1);
        }}
      />
    </section>
  );
}
