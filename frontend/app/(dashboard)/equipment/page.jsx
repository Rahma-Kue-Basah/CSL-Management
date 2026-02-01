"use client";

import Link from "next/link";
import NextImage from "next/image";
import { Image as AntImage } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Filter, X, Plus, Trash2 } from "lucide-react";

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
import { useEquipments } from "@/hooks/use-equipments";
import { useEquipmentActions } from "@/hooks/use-equipment-actions";
import { useRoomOptions } from "@/hooks/use-room-options";
import { EquipmentDetailCollapsible } from "@/components/modal/equipment-detail-collapsible";
import { useDeleteEquipment } from "@/hooks/use-delete-equipment";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  EQUIPMENT_CATEGORY_OPTIONS,
  EQUIPMENT_STATUS_OPTIONS,
  MOVEABLE_OPTIONS,
} from "@/constants/equipments";
import { useLoadProfile } from "@/hooks/use-load-profile";
import { isStaffOrAboveRole } from "@/constants/roles";
import { toast } from "sonner";

const STATUS_STYLES = {
  available: "bg-emerald-500/10 text-emerald-600",
  borrowed: "bg-sky-500/10 text-sky-700",
  maintenance: "bg-amber-500/10 text-amber-700",
  broken: "bg-rose-500/10 text-rose-700",
  storage: "bg-slate-500/10 text-slate-600",
};

const formatStatus = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";

export default function EquipmentPage() {
  const { profile } = useLoadProfile();
  const canCreateEquipment = isStaffOrAboveRole(profile?.role);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    is_moveable: "",
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    quantity: "",
    category: "",
    roomId: "",
    isMoveable: "true",
    description: "",
    imageId: null,
    imageFile: null,
  });
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const { rooms } = useRoomOptions();
  const { updateEquipment, isSubmitting: isUpdating } =
    useEquipmentActions();
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const { deleteEquipment, isDeleting } = useDeleteEquipment();
  const {
    equipments,
    setEquipments,
    totalCount,
    setTotalCount,
    isLoading,
    error,
  } = useEquipments(page, pageSize, filters);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handle);
  }, [search]);

  const filteredEquipments = useMemo(() => {
    if (!debouncedSearch) return equipments;
    const keyword = debouncedSearch.toLowerCase();
    return equipments.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const category = String(item.category || "").toLowerCase();
      const room = String(item.roomDetail?.name || "").toLowerCase();
      return (
        name.includes(keyword) ||
        category.includes(keyword) ||
        room.includes(keyword)
      );
    });
  }, [equipments, debouncedSearch]);

  const roomOptions = useMemo(
    () => rooms.map((room) => ({ value: room.id, label: room.label })),
    [rooms],
  );

  const resetFilterState = () => {
    setFilters({
      status: "",
      category: "",
      is_moveable: "",
    });
    setPage(1);
  };

  const handleView = (item) => {
    if (selectedEquipment?.id === item.id && detailOpen) {
      setDetailOpen(false);
      setSelectedEquipment(null);
      return;
    }
    setSelectedEquipment(item);
    setDetailOpen(true);
    setIsEditing(false);
    setEditForm({
      name: item.name || "",
      quantity: item.quantity?.toString() || "",
      category: item.category || "",
      roomId: item.room || "",
      isMoveable: String(Boolean(item.isMoveable)),
      description: item.description || "",
      imageId: item.imageDetail?.id || null,
      imageFile: null,
    });
  };

  const handleEdit = (item) => {
    setSelectedEquipment(item);
    setDetailOpen(true);
    setIsEditing(true);
    setEditForm({
      name: item.name || "",
      quantity: item.quantity?.toString() || "",
      category: item.category || "",
      roomId: item.room || "",
      isMoveable: String(Boolean(item.isMoveable)),
      description: item.description || "",
      imageId: item.imageDetail?.id || null,
      imageFile: null,
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_IMAGE_SIZE) {
      toast.error("Ukuran gambar maksimal 5MB.");
      return;
    }
    setEditForm((prev) => ({ ...prev, imageFile: file }));
  };

  const handleEditSave = async () => {
    if (!selectedEquipment?.id) return;
    if (!editForm.name.trim()) {
      toast.error("Nama equipment wajib diisi.");
      return;
    }
    if (!editForm.quantity || Number(editForm.quantity) <= 0) {
      toast.error("Jumlah harus lebih dari 0.");
      return;
    }
    if (!editForm.category) {
      toast.error("Kategori wajib dipilih.");
      return;
    }
    if (!editForm.roomId) {
      toast.error("Ruangan wajib dipilih.");
      return;
    }

    const payload = {
      ...editForm,
      isMoveable: editForm.isMoveable === "true",
    };

    const result = await updateEquipment(selectedEquipment.id, payload);
    if (result.ok) {
      toast.success("Equipment berhasil diperbarui.");
      setEquipments((prev) =>
        prev.map((item) =>
          item.id === selectedEquipment.id
            ? {
                ...item,
                name: editForm.name,
                quantity: Number(editForm.quantity),
                category: editForm.category,
                room: editForm.roomId,
                isMoveable: editForm.isMoveable === "true",
                description: editForm.description,
              }
            : item,
        ),
      );
      setSelectedEquipment((prev) =>
        prev
          ? {
              ...prev,
              name: editForm.name,
              quantity: Number(editForm.quantity),
              category: editForm.category,
              room: editForm.roomId,
              isMoveable: editForm.isMoveable === "true",
              description: editForm.description,
            }
          : prev,
      );
      setIsEditing(false);
      if (editForm.imageFile) {
        window.location.reload();
      }
    } else {
      toast.error(result.message || "Gagal memperbarui equipment.");
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate?.id) return;
    const result = await deleteEquipment(deleteCandidate.id);
    if (!result.ok) {
      toast.error(result.message || "Gagal menghapus equipment.");
      return;
    }
    setEquipments((prev) =>
      prev.filter((item) => item.id !== deleteCandidate.id),
    );
    setTotalCount((prev) =>
      typeof prev === "number" ? Math.max(0, prev - 1) : prev,
    );
    setDeleteCandidate(null);
    toast.success("Equipment berhasil dihapus.");
  };

  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || equipments.length) / pageSize),
  );

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">
          Total {debouncedSearch ? filteredEquipments.length : totalCount || equipments.length} equipment terdaftar.
        </p>
        {canCreateEquipment ? (
          <Button asChild size="sm" className="gap-2">
            <Link href="/equipment/form">
              <Plus className="h-4 w-4" />
              Tambah Equipment
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
              <TableHead className="w-[160px]">Nama</TableHead>
              <TableHead className="w-[140px]">Kategori</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[90px]">Jumlah</TableHead>
              <TableHead className="w-[200px]">Ruangan</TableHead>
              <TableHead className="w-[120px]">Moveable</TableHead>
              <TableHead className="w-[180px]">Foto</TableHead>
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
            ) : filteredEquipments.length ? (
              filteredEquipments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium truncate">{item.name}</TableCell>
                  <TableCell className="truncate">{item.category}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        STATUS_STYLES[item.status] ||
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-muted-foreground truncate">
                    {item.roomDetail?.name || item.room || "-"}
                  </TableCell>
                  <TableCell>{item.isMoveable ? "Ya" : "Tidak"}</TableCell>
                  <TableCell>
                    {item.imageDetail?.url ? (
                      <AntImage
                        src={item.imageDetail.url}
                        alt={item.name || "Equipment image"}
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
                  <TableCell className="text-center sticky right-0 bg-card">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog
                        open={deleteCandidate?.id === item.id}
                        onOpenChange={(open) =>
                          setDeleteCandidate(open ? item : null)
                        }
                      >
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus equipment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tindakan ini tidak bisa dibatalkan. Equipment{" "}
                              <span className="font-semibold">
                                {item.name}
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
                  {error || "Tidak ada data equipment."}
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
      <EquipmentDetailCollapsible
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setSelectedEquipment(null);
            setIsEditing(false);
          }
        }}
        selectedEquipment={selectedEquipment}
        editForm={editForm}
        isEditing={isEditing}
        isUpdating={isUpdating}
        onEditStart={() => setIsEditing(true)}
        onCancel={() => setIsEditing(false)}
        onSave={handleEditSave}
        onChange={handleEditChange}
        onImageChange={handleImageChange}
        roomOptions={roomOptions}
        categoryOptions={EQUIPMENT_CATEGORY_OPTIONS}
        moveableOptions={MOVEABLE_OPTIONS}
      />
    </section>
  );
}

function FilterBar({ search, onSearchChange, filters, onFiltersChange }) {
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
          placeholder="Nama atau kategori"
        />
        <SelectField
          label="Status"
          value={filters.status}
          options={EQUIPMENT_STATUS_OPTIONS}
          placeholder="Semua"
          onChange={(value) => handleChange("status", value)}
        />
        <SelectField
          label="Kategori"
          value={filters.category}
          options={EQUIPMENT_CATEGORY_OPTIONS}
          placeholder="Semua"
          onChange={(value) => handleChange("category", value)}
        />
        <SelectField
          label="Moveable"
          value={filters.is_moveable}
          options={MOVEABLE_OPTIONS}
          placeholder="Semua"
          onChange={(value) => handleChange("is_moveable", value)}
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
