"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Eye, Loader2, Plus, Trash2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminFilterCard } from "@/components/admin/admin-filter-card";
import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import {
  EQUIPMENT_CATEGORY_OPTIONS,
  EQUIPMENT_STATUS_OPTIONS,
  MOVEABLE_OPTIONS,
} from "@/constants/equipments";
import { API_BASE_URL, API_EQUIPMENT_DETAIL } from "@/constants/api";
import { useCreateEquipment } from "@/hooks/equipments/use-create-equipment";
import { useDeleteEquipment } from "@/hooks/equipments/use-delete-equipment";
import {
  useEquipments,
  type EquipmentRow,
} from "@/hooks/equipments/use-equipments";
import { useUpdateEquipment } from "@/hooks/equipments/use-update-equipment";
import { useRoomOptions } from "@/hooks/rooms/use-room-options";
import { authFetch } from "@/lib/auth";
import { toast } from "sonner";

const PAGE_SIZE = 20;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type ActionType = "create" | "detail";

type EquipmentDetailData = {
  id: string | number;
  name: string;
  quantity: string;
  category: string;
  status: string;
  roomId: string;
  roomName: string;
  isMoveable: boolean;
  description: string;
  imageId: string | number | null;
  imageUrl: string;
};

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

function resolveAssetUrl(value: string | null | undefined) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

export default function AdminEquipmentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [room, setRoom] = useState("");
  const [moveable, setMoveable] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<EquipmentRow | null>(
    null,
  );
  const { rooms: filterRooms, isLoading: isLoadingFilterRooms } =
    useRoomOptions();
  const {
    deleteEquipment,
    isDeleting,
    errorMessage: deleteErrorMessage,
    setErrorMessage: setDeleteErrorMessage,
  } = useDeleteEquipment();

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const { equipments, totalCount, isLoading, hasLoadedOnce, error } =
    useEquipments(
      page,
      PAGE_SIZE,
      {
        search: debouncedSearch,
        status,
        category,
        room,
        is_moveable: moveable,
      },
      reloadKey,
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
    setRoom("");
    setMoveable("");
    setPage(1);
    setFilterOpen(false);
  };

  const handleCreatedOrUpdated = () => {
    setReloadKey((prev) => prev + 1);
    setPage(1);
  };

  const handleDelete = async (item: EquipmentRow | EquipmentDetailData) => {
    setDeleteErrorMessage("");
    const result = await deleteEquipment(item.id);
    if (!result.ok) return;

    setDeleteCandidate(null);
    setReloadKey((prev) => prev + 1);
    toast.success("Peralatan berhasil dihapus.");
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full min-w-0 space-y-4">
          <AdminPageHeader
            title="Inventarisasi Peralatan"
            description={`Total ${totalEquipments} peralatan terdaftar.`}
            icon={<Plus className="h-5 w-5 text-sky-200" />}
            actions={
              <Button
                type="button"
                size="sm"
                className="bg-white text-slate-900 hover:bg-slate-100"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Tambah Peralatan
              </Button>
            }
          />

          <AdminFilterCard
            open={filterOpen}
            onToggle={() => setFilterOpen((prev) => !prev)}
            onReset={resetFilters}
          >
            <form
              className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
              }}
            >
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                  Cari
                </label>
                <Input
                  type="search"
                  value={search}
                  placeholder="Nama atau kategori"
                  className="border-slate-400 bg-white shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
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
                  className="h-9 w-full rounded-md border border-slate-400 bg-white px-2 text-sm outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
                  disabled={isLoadingFilterRooms}
                >
                  <option value="">
                    {isLoadingFilterRooms
                      ? "Memuat ruangan..."
                      : "Semua ruangan"}
                  </option>
                  {filterRooms.map((roomItem) => (
                    <option key={roomItem.id} value={roomItem.id}>
                      {roomItem.label}
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

          <div className="w-full max-w-full overflow-x-auto rounded border border-slate-200 bg-card">
            <table className="w-full min-w-[960px] table-fixed">
              <thead className="border-b border-slate-800 bg-slate-900">
                <tr className="text-left text-sm">
                  <th className="w-[180px] px-3 py-3 font-medium text-slate-50">
                    Nama
                  </th>
                  <th className="w-[140px] px-3 py-3 font-medium text-slate-50">
                    Kategori
                  </th>
                  <th className="w-[120px] px-3 py-3 font-medium text-slate-50">
                    Status
                  </th>
                  <th className="w-[90px] px-3 py-3 font-medium text-slate-50">
                    Jumlah
                  </th>
                  <th className="w-[200px] px-3 py-3 font-medium text-slate-50">
                    Ruangan
                  </th>
                  <th className="w-[120px] px-3 py-3 font-medium text-slate-50">
                    Moveable
                  </th>
                  <th className="sticky right-0 z-10 relative w-[130px] bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-700">
                    Aksi
                  </th>
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
                    <tr
                      key={String(item.id)}
                      className="border-b last:border-b-0"
                    >
                      <td className="truncate px-3 py-2 font-medium">
                        {item.name}
                      </td>
                      <td className="truncate px-3 py-2">{item.category}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[item.status] || "bg-muted text-muted-foreground"}`}
                        >
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="truncate px-3 py-2 text-muted-foreground">
                        {item.roomName}
                      </td>
                      <td className="px-3 py-2">
                        {item.isMoveable ? "Ya" : "Tidak"}
                      </td>
                      <td className="sticky right-0 z-10 relative bg-card px-3 py-2 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              navigate(`/admin/inventory/equipment/${item.id}`, {
                                state: { from: location.pathname },
                              });
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={deleteCandidate?.id === item.id}
                            onOpenChange={(open) => {
                              if (open) {
                                setDeleteCandidate(item);
                                return;
                              }
                              if (deleteCandidate?.id === item.id)
                                setDeleteCandidate(null);
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent size="sm">
                              <AlertDialogHeader className="place-items-start text-left">
                                <AlertDialogTitle>
                                  Hapus peralatan?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Peralatan{" "}
                                  <span className="font-semibold">
                                    {item.name}
                                  </span>{" "}
                                  akan dihapus.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="sm:justify-start">
                                <AlertDialogCancel disabled={isDeleting}>
                                  Batal
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  disabled={isDeleting}
                                  onClick={() => {
                                    void handleDelete(item);
                                  }}
                                >
                                  {isDeleting ? "Menghapus..." : "Hapus"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      Tidak ada data peralatan.
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
      </div>
      <CreateEquipmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreatedOrUpdated}
      />
    </section>
  );
}
type CreateEquipmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

function CreateEquipmentDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateEquipmentDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    category: "",
    roomId: "",
    isMoveable: "true",
    description: "",
    imageFile: null as File | null,
  });
  const {
    rooms,
    isLoading: isLoadingRooms,
    error: roomError,
  } = useRoomOptions();
  const { createEquipment, isSubmitting, errorMessage, setErrorMessage } =
    useCreateEquipment();

  const previewUrl = useMemo(
    () => (formData.imageFile ? URL.createObjectURL(formData.imageFile) : ""),
    [formData.imageFile],
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_IMAGE_SIZE) {
      setErrorMessage("Ukuran gambar maksimal 5MB.");
      return;
    }
    setErrorMessage("");
    setFormData((prev) => ({ ...prev, imageFile: file }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim())
      return setErrorMessage("Nama peralatan wajib diisi.");
    if (!formData.quantity || Number(formData.quantity) <= 0)
      return setErrorMessage("Jumlah harus lebih dari 0.");
    if (!formData.category) return setErrorMessage("Kategori wajib dipilih.");
    if (!formData.roomId) return setErrorMessage("Ruangan wajib dipilih.");

    const result = await createEquipment({
      name: formData.name,
      quantity: formData.quantity,
      category: formData.category,
      roomId: formData.roomId,
      isMoveable: formData.isMoveable === "true",
      description: formData.description,
      imageFile: formData.imageFile,
    });

    if (result.ok) {
      onCreated();
      onOpenChange(false);
      toast.success("Peralatan berhasil ditambahkan.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setErrorMessage("");
          setFormData({
            name: "",
            quantity: "",
            category: "",
            roomId: "",
            isMoveable: "true",
            description: "",
            imageFile: null,
          });
        }
      }}
    >
      <DialogContent className="w-[min(720px,calc(100%-2rem))] max-w-none sm:max-w-none [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]">
        <DialogHeader>
          <DialogTitle>Tambah Peralatan</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
        <DetailField
          label="Nama"
          value={formData.name}
          editable
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, name: value }))
          }
        />
        <DetailField
          label="Jumlah"
          value={formData.quantity}
          editable
          type="number"
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, quantity: value }))
          }
        />

        <SelectDetailField
          label="Kategori"
          value={formData.category}
          editable
          options={EQUIPMENT_CATEGORY_OPTIONS}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, category: value }))
          }
          placeholder="Pilih kategori"
        />

        <SelectDetailField
          label="Ruangan"
          value={formData.roomId}
          editable
          options={rooms.map((room) => ({ value: room.id, label: room.label }))}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, roomId: value }))
          }
          placeholder={isLoadingRooms ? "Memuat ruangan..." : "Pilih ruangan"}
          disabled={isLoadingRooms}
        />
        {roomError ? (
          <p className="text-xs text-destructive">{roomError}</p>
        ) : null}

        <SelectDetailField
          label="Moveable"
          value={formData.isMoveable}
          editable
          options={MOVEABLE_OPTIONS}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, isMoveable: value }))
          }
          placeholder="Pilih status"
        />

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Deskripsi</p>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Deskripsi (opsional)"
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Gambar</p>
          <label className="group flex cursor-pointer items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm hover:border-primary/50">
            <span className="truncate text-muted-foreground">
              {formData.imageFile
                ? formData.imageFile.name
                : "Pilih gambar (opsional)"}
            </span>
            {/* <span className="shrink-0 text-xs font-medium">Upload</span> */}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
            {formData.imageFile ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Hapus gambar yang diunggah"
                className="rounded-full text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, imageFile: null }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </label>
        </div>

        {previewUrl ? (
          <div className="space-y-1">
            {/* <p className="text-xs font-medium text-muted-foreground">Gambar</p> */}
            <div className="overflow-hidden rounded-lg border bg-muted">
              <img
                src={previewUrl}
                alt="Preview peralatan"
                className="h-56 w-full object-cover"
              />
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Plus className="h-4 w-4" />
              {isSubmitting ? "Menyimpan..." : "Simpan Peralatan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DetailEquipmentPanelProps = {
  item: EquipmentRow | null;
  isDeleting: boolean;
  deleteErrorMessage: string;
  onDelete: (item: EquipmentRow | EquipmentDetailData) => Promise<void>;
  onUpdated: () => void;
  onClose: () => void;
};

function DetailEquipmentPanel({
  item,
  isDeleting,
  deleteErrorMessage,
  onDelete,
  onUpdated,
  onClose,
}: DetailEquipmentPanelProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailItem, setDetailItem] = useState<EquipmentDetailData | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    category: "",
    roomId: "",
    isMoveable: "true",
    description: "",
    imageId: null as string | number | null,
    imageFile: null as File | null,
  });
  const {
    rooms,
    isLoading: isLoadingRooms,
    error: roomError,
  } = useRoomOptions();
  const {
    updateEquipment,
    isSubmitting,
    errorMessage: updateErrorMessage,
    setErrorMessage: setUpdateErrorMessage,
  } = useUpdateEquipment();

  const roomOptions = useMemo(
    () => rooms.map((room) => ({ value: room.id, label: room.label })),
    [rooms],
  );
  const previewUrl = useMemo(
    () => (formData.imageFile ? URL.createObjectURL(formData.imageFile) : ""),
    [formData.imageFile],
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    setIsEditing(false);
    setConfirmDeleteOpen(false);
    setUpdateErrorMessage("");
  }, [item?.id, setUpdateErrorMessage]);

  useEffect(() => {
    if (!item?.id) {
      setDetailItem(null);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const loadDetail = async () => {
      setIsLoadingDetail(true);
      setDetailError("");

      try {
        const response = await authFetch(API_EQUIPMENT_DETAIL(item.id), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            `Gagal memuat detail peralatan (${response.status}).`,
          );

        const data = (await response.json()) as {
          id?: string | number | null;
          name?: string | null;
          quantity?: number | string | null;
          category?: string | null;
          status?: string | null;
          room?: string | number | null;
          room_detail?: { name?: string | null } | null;
          is_moveable?: boolean | null;
          description?: string | null;
          image?: string | number | null;
          image_detail?: { url?: string | null } | null;
        };

        const nextDetail: EquipmentDetailData = {
          id: data.id ?? item.id,
          name: String(data.name ?? item.name),
          quantity: String(data.quantity ?? item.quantity),
          category: String(data.category ?? item.category),
          status: String(data.status ?? item.status),
          roomId: String(data.room ?? ""),
          roomName: String(data.room_detail?.name ?? item.roomName),
          isMoveable: Boolean(data.is_moveable ?? item.isMoveable),
          description: String(data.description ?? ""),
          imageId: data.image ?? null,
          imageUrl: resolveAssetUrl(data.image_detail?.url ?? ""),
        };

        setDetailItem(nextDetail);
        setFormData({
          name: nextDetail.name,
          quantity: nextDetail.quantity,
          category: nextDetail.category,
          roomId: nextDetail.roomId,
          isMoveable: String(nextDetail.isMoveable),
          description: nextDetail.description,
          imageId: nextDetail.imageId,
          imageFile: null,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setDetailError(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memuat detail.",
        );
        setDetailItem({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          status: item.status,
          roomId: "",
          roomName: item.roomName,
          isMoveable: item.isMoveable,
          description: "",
          imageId: null,
          imageUrl: "",
        });
      } finally {
        if (isAborted || controller.signal.aborted) return;
        setIsLoadingDetail(false);
      }
    };

    void loadDetail();

    return () => {
      isAborted = true;
      controller.abort();
    };
  }, [
    item?.id,
    item?.name,
    item?.quantity,
    item?.category,
    item?.status,
    item?.roomName,
    item?.isMoveable,
  ]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_IMAGE_SIZE) {
      setUpdateErrorMessage("Ukuran gambar maksimal 5MB.");
      return;
    }
    setUpdateErrorMessage("");
    setFormData((prev) => ({ ...prev, imageFile: file }));
  };

  const handleSave = async () => {
    if (!detailItem) return;
    setUpdateErrorMessage("");

    if (!formData.name.trim())
      return setUpdateErrorMessage("Nama peralatan wajib diisi.");
    if (!formData.quantity || Number(formData.quantity) <= 0)
      return setUpdateErrorMessage("Jumlah harus lebih dari 0.");
    if (!formData.category)
      return setUpdateErrorMessage("Kategori wajib dipilih.");
    if (!formData.roomId)
      return setUpdateErrorMessage("Ruangan wajib dipilih.");

    const result = await updateEquipment(detailItem.id, {
      name: formData.name,
      quantity: formData.quantity,
      category: formData.category,
      roomId: formData.roomId,
      isMoveable: formData.isMoveable === "true",
      description: formData.description,
      imageId: formData.imageId,
      imageFile: formData.imageFile,
    });

    if (!result.ok) return;

    const responseData = result.data as
      | {
          image?: string | number | null;
          image_detail?: { url?: string | null } | null;
          room_detail?: { name?: string | null } | null;
        }
      | undefined;

    setDetailItem((prev) =>
      prev
        ? {
            ...prev,
            name: formData.name.trim(),
            quantity: formData.quantity,
            category: formData.category,
            roomId: formData.roomId,
            roomName: String(
              responseData?.room_detail?.name ??
                roomOptions.find((opt) => opt.value === formData.roomId)
                  ?.label ??
                prev.roomName,
            ),
            isMoveable: formData.isMoveable === "true",
            description: formData.description.trim(),
            imageId: responseData?.image ?? prev.imageId,
            imageUrl: resolveAssetUrl(
              responseData?.image_detail?.url ?? prev.imageUrl,
            ),
          }
        : prev,
    );

    setFormData((prev) => ({ ...prev, imageFile: null }));
    setIsEditing(false);
    onUpdated();
    toast.success("Peralatan berhasil diperbarui.");
  };

  if (!item) {
    return (
      <div className="max-h-[calc(100svh-7rem)] overflow-y-auto p-4">
        <PanelHeader title="Detail Peralatan" onClose={onClose} />
        <p className="text-sm text-muted-foreground">
          Pilih peralatan untuk melihat detail.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100svh-7rem)] space-y-4 overflow-y-auto p-4">
      <PanelHeader title="Detail Peralatan" onClose={onClose} />

      {isLoadingDetail ? (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : null}

      {detailError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {detailError}
        </div>
      ) : null}

      {detailItem ? (
        <>
          <DetailField
            label="Nama"
            value={isEditing ? formData.name : detailItem.name}
            editable={isEditing}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, name: value }))
            }
          />
          <DetailField
            label="Jumlah"
            value={isEditing ? formData.quantity : detailItem.quantity}
            editable={isEditing}
            type="number"
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, quantity: value }))
            }
          />
          <SelectDetailField
            label="Kategori"
            value={isEditing ? formData.category : detailItem.category}
            editable={isEditing}
            options={EQUIPMENT_CATEGORY_OPTIONS}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, category: value }))
            }
          />
          <SelectDetailField
            label="Ruangan"
            value={isEditing ? formData.roomId : detailItem.roomName}
            editable={isEditing}
            options={roomOptions}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, roomId: value }))
            }
            placeholder={isLoadingRooms ? "Memuat ruangan..." : "Pilih ruangan"}
            disabled={isLoadingRooms}
          />
          {roomError ? (
            <p className="text-xs text-destructive">{roomError}</p>
          ) : null}
          <SelectDetailField
            label="Moveable"
            value={
              isEditing
                ? formData.isMoveable
                : detailItem.isMoveable
                  ? "Ya"
                  : "Tidak"
            }
            editable={isEditing}
            options={MOVEABLE_OPTIONS}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, isMoveable: value }))
            }
          />
          <DetailField label="Status" value={formatStatus(detailItem.status)} />

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Deskripsi
            </p>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            ) : (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                {detailItem.description || "-"}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Gambar
              </p>
              <label className="group flex cursor-pointer items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm hover:border-primary/50">
                <span className="truncate text-muted-foreground">
                  {formData.imageFile
                    ? formData.imageFile.name
                    : "Pilih gambar (opsional)"}
                </span>
                <span className="shrink-0 text-xs font-medium">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
              {formData.imageFile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Hapus gambar yang diunggah"
                  className="rounded-full text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, imageFile: null }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ) : null}

          {previewUrl || detailItem.imageUrl ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Gambar
              </p>
              <div className="overflow-hidden rounded-lg border bg-muted">
                <img
                  src={previewUrl || detailItem.imageUrl}
                  alt="Preview peralatan"
                  className="h-56 w-full object-cover"
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {updateErrorMessage ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {updateErrorMessage}
        </div>
      ) : null}

      {deleteErrorMessage ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {deleteErrorMessage}
        </div>
      ) : null}

      {detailItem ? (
        <div className="grid grid-cols-2 gap-2">
          {isEditing ? (
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                setIsEditing(false);
                setUpdateErrorMessage("");
                setFormData({
                  name: detailItem.name,
                  quantity: detailItem.quantity,
                  category: detailItem.category,
                  roomId: detailItem.roomId,
                  isMoveable: String(detailItem.isMoveable),
                  description: detailItem.description,
                  imageId: detailItem.imageId,
                  imageFile: null,
                });
              }}
            >
              Batal
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className={isEditing ? "col-span-1" : "col-span-2"}
            disabled={isSubmitting || isLoadingDetail || !detailItem}
            onClick={() => {
              if (isEditing) {
                void handleSave();
                return;
              }
              setIsEditing(true);
            }}
          >
            {isEditing ? (isSubmitting ? "Menyimpan..." : "Simpan") : "Edit"}
          </Button>
        </div>
      ) : null}

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            disabled={isDeleting || isSubmitting || !detailItem}
          >
            {isDeleting ? "Menghapus..." : "Hapus Peralatan"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>Hapus peralatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Peralatan{" "}
              <span className="font-semibold">
                {detailItem?.name ?? item.name}
              </span>{" "}
              akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start">
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting || !detailItem}
              onClick={() => {
                if (detailItem) void onDelete(detailItem);
              }}
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PanelHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="-mx-4 -mt-4 mb-4 flex items-center justify-between gap-2 rounded-t-md bg-slate-900 px-4 py-3 text-white">
      <h3 className="text-base font-semibold">{title}</h3>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-slate-100 hover:bg-white/15 hover:text-white"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
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
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-slate-400 bg-white px-2 text-sm outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
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

function DetailField({
  label,
  value,
  editable = false,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {editable ? (
        <Input
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ) : (
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
          {value || "-"}
        </div>
      )}
    </div>
  );
}

function SelectDetailField({
  label,
  value,
  editable = false,
  options,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  editable?: boolean;
  options: Array<{ value: string; label: string }>;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  if (!editable) {
    return <DetailField label={label} value={value} />;
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        disabled={disabled}
      >
        <option value="">
          {placeholder || `Pilih ${label.toLowerCase()}`}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
