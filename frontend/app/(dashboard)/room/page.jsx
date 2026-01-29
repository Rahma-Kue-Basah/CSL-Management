"use client";

import Link from "next/link";
import NextImage from "next/image";
import { Image as AntImage } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Filter, X, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLoadProfile } from "@/hooks/use-load-profile";
import { isStaffOrAboveRole } from "@/constants/roles";
import { useRooms } from "@/hooks/use-rooms";
import { RoomDetailCollapsible } from "@/components/modal/room-detail-collapsible";
import { usePicUsers } from "@/hooks/use-pic-users";
import { useDeleteRoom } from "@/hooks/use-delete-room";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function RoomPage() {
  const { profile } = useLoadProfile();
  const canCreateRoom = isStaffOrAboveRole(profile?.role);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    pic: "",
    floor: "",
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const { picUsers } = usePicUsers();
  const { rooms, setRooms, totalCount, setTotalCount, isLoading, error } = useRooms(
    page,
    pageSize,
    filters,
  );
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const { deleteRoom, isDeleting } = useDeleteRoom();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleView = (room) => {
    if (selectedRoom?.id === room.id && detailOpen) {
      setDetailOpen(false);
      setSelectedRoom(null);
      return;
    }
    setSelectedRoom(room);
    setDetailOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteCandidate?.id) return;
    const result = await deleteRoom(deleteCandidate.id);
    if (!result.ok) {
      toast.error(result.message || "Gagal menghapus ruangan.");
      return;
    }
    setRooms((prev) => prev.filter((item) => item.id !== deleteCandidate.id));
    setTotalCount((prev) => (typeof prev === "number" ? Math.max(0, prev - 1) : prev));
    setSelectedRoom((prev) =>
      prev?.id === deleteCandidate.id ? null : prev,
    );
    setDeleteCandidate(null);
    toast.success("Ruangan berhasil dihapus.");
  };

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handle);
  }, [search]);

  const filteredRooms = useMemo(() => {
    if (!debouncedSearch) return rooms;
    const keyword = debouncedSearch.toLowerCase();
    return rooms.filter((room) => {
      const name = String(room.name || "").toLowerCase();
      const number = String(room.number || "").toLowerCase();
      const pic =
        String(room.picDetail?.full_name || room.picDetail?.email || "").toLowerCase();
      return (
        name.includes(keyword) ||
        number.includes(keyword) ||
        pic.includes(keyword)
      );
    });
  }, [rooms, debouncedSearch]);

  const resetFilterState = () => {
    setFilters({
      pic: "",
      floor: "",
    });
    setPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || rooms.length) / pageSize),
  );

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Total {debouncedSearch ? filteredRooms.length : totalCount || rooms.length} ruangan terdaftar.
          </p>
        </div>
        {canCreateRoom ? (
          <Button asChild size="sm" className="gap-2">
            <Link href="/room/form">
              <Plus className="h-4 w-4" />
              Tambah Ruangan
            </Link>
          </Button>
        ) : null}
      </div>

      <Collapsible
        open={filterOpen}
        onOpenChange={(open) => {
          if (!open) resetFilterState();
          setFilterOpen(open);
        }}
      >
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-medium">Filter</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (filterOpen) resetFilterState();
                setFilterOpen((v) => !v);
              }}
              className="h-8 gap-2"
            >
              {filterOpen ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              <span className="sr-only">
                {filterOpen ? "Sembunyikan filter" : "Tampilkan filter"}
              </span>
            </Button>
          </div>
          <CollapsibleContent className="border-t px-3 pb-3 pt-2">
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              filters={filters}
              picUsers={picUsers}
              onFiltersChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
            />
          </CollapsibleContent>
        </div>
      </Collapsible>

      <div className="rounded-lg border bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Nama</TableHead>
              <TableHead className="w-[100px]">No. Ruang</TableHead>
              <TableHead className="w-[90px]">Lantai</TableHead>
              <TableHead className="w-[120px]">Kapasitas</TableHead>
              <TableHead className="w-[200px]">Deskripsi</TableHead>
              <TableHead className="w-[180px]">Foto</TableHead>
              <TableHead className="w-[200px]">PIC</TableHead>
              <TableHead className="w-[160px] text-center sticky right-0 bg-card z-10">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-6 text-center text-muted-foreground"
                >
                  <NextImage
                    src="/logo/stem.png"
                    alt="STEM Logo"
                    width={48}
                    height={48}
                    className="mx-auto animate-spin"
                    priority
                  />
                </TableCell>
              </TableRow>
            ) : filteredRooms.length ? (
              filteredRooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium truncate">{room.name}</TableCell>
                  <TableCell className="truncate">{room.number}</TableCell>
                  <TableCell>{room.floor}</TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell className="whitespace-normal break-words">
                    {room.description || "-"}
                  </TableCell>
                  <TableCell>
                    {room.imageDetail?.url ? (
                      <AntImage
                        src={room.imageDetail.url}
                        alt={room.name || "Room image"}
                        width={152}
                        height={96}
                        // preview={false}
                        className="rounded-md"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate">
                    {room.picDetail?.full_name || room.picDetail?.email || "-"}
                  </TableCell>
                  <TableCell className="text-center sticky right-0 bg-card">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(room)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog
                        open={deleteCandidate?.id === room.id}
                        onOpenChange={(open) =>
                          setDeleteCandidate(open ? room : null)
                        }
                      >
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus ruangan?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tindakan ini tidak bisa dibatalkan. Ruangan{" "}
                              <span className="font-semibold">
                                {room.name}
                              </span>{" "}
                              akan dihapus permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-6 text-center text-muted-foreground"
                >
                  {error || "Tidak ada data ruangan."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination className="w-full justify-between">
        <p className="text-sm text-muted-foreground">
          Halaman {page} dari {totalPages}
        </p>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage((p) => Math.max(1, p - 1));
              }}
              className={
                page <= 1 || isLoading ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage((p) => (p < totalPages ? p + 1 : p));
              }}
              className={
                page >= totalPages || isLoading
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <RoomDetailCollapsible
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedRoom(null);
        }}
        selectedRoom={selectedRoom}
      />
    </section>
  );
}

function FilterBar({ search, onSearchChange, filters, onFiltersChange, picUsers }) {
  const handleChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="rounded-lg bg-card px-1 py-3">
      <form
        className="flex flex-wrap justify-between items-end gap-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <InputField
          label="Cari"
          value={search}
          onChange={onSearchChange}
          placeholder="Nama ruangan atau nomor"
        />
        <SelectField
          label="PIC"
          value={filters.pic}
          options={picUsers.map((user) => ({
            value: user.profileId,
            label: `${user.name} (${user.role})`,
          }))}
          placeholder="Pilih PIC"
          onChange={(value) => handleChange("pic", value)}
        />
        <InputField
          label="Lantai"
          type="number"
          value={filters.floor}
          onChange={(value) => handleChange("floor", value)}
          placeholder="Semua"
        />
      </form>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div className="flex flex-col gap-0.5 w-full sm:w-[230px] min-w-0">
      <label className="text-xs font-medium leading-none mb-2 text-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm shadow-inner outline-none focus:border-primary"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-0.5 w-full sm:w-[230px] min-w-0">
      <label className="text-xs font-medium mb-2 leading-none text-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary"
      >
        <option value="">{placeholder || "Semua"}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
