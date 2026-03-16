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
import { InventoryFilterCard } from "@/components/admin/inventory/inventory-filter-card";
import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import { PicMultiSelect } from "@/components/admin/inventory/PicMultiSelect";
import { API_BASE_URL, API_ROOM_DETAIL } from "@/constants/api";
import { useCreateRoom } from "@/hooks/rooms/use-create-room";
import { useDeleteRoom } from "@/hooks/rooms/use-delete-room";
import { useRooms, type RoomRow } from "@/hooks/rooms/use-rooms";
import { useUpdateRoom } from "@/hooks/rooms/use-update-room";
import { usePicUsers } from "@/hooks/users/use-pic-users";
import { authFetch } from "@/lib/auth";
import { toast } from "sonner";

const PAGE_SIZE = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type ActionType = "create" | "detail";

function resolveAssetUrl(value: string | null | undefined) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

function joinPicNames(names: string[]) {
  return names.length ? names.join(", ") : "-";
}

export default function AdminRoomsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [floor, setFloor] = useState("");
  const [pic, setPic] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<RoomRow | null>(null);
  const { picUsers: filterPicUsers, isLoading: isLoadingFilterPics } =
    usePicUsers();
  const {
    deleteRoom,
    isDeleting,
    errorMessage: deleteErrorMessage,
    setErrorMessage: setDeleteErrorMessage,
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
    setDeleteErrorMessage("");
    const roomId = room.id;
    const result = await deleteRoom(roomId);

    if (!result.ok) return;

    setDeleteCandidate(null);
    setReloadKey((prev) => prev + 1);
    toast.success("Ruangan berhasil dihapus.");
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full min-w-0 space-y-4">
          <AdminPageHeader
            title="Inventarisasi Ruangan"
            description={`Total ${totalRooms} ruangan terdaftar.`}
            icon={<Plus className="h-5 w-5 text-sky-200" />}
            actions={
              <Button
                type="button"
                size="sm"
                className="bg-white text-slate-900 hover:bg-slate-100"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Tambah Ruangan
              </Button>
            }
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
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
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
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
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
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
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
                  <option value="">
                    {isLoadingFilterPics ? "Memuat PIC..." : "Semua PIC"}
                  </option>
                  {filterPicUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
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
            <table className="w-full min-w-[900px] table-fixed">
              <thead className="border-b border-slate-800 bg-slate-900">
                <tr className="text-left text-sm">
                  <th className="w-[180px] px-3 py-3 font-medium text-slate-50">
                    Nama
                  </th>
                  <th className="w-[120px] px-3 py-3 font-medium text-slate-50">
                    No. Ruang
                  </th>
                  <th className="w-[90px] px-3 py-3 font-medium text-slate-50">
                    Lantai
                  </th>
                  <th className="w-[120px] px-3 py-3 font-medium text-slate-50">
                    Kapasitas
                  </th>
                  <th className="w-[220px] px-3 py-3 font-medium text-slate-50">
                    Deskripsi
                  </th>
                  <th className="w-[220px] px-3 py-3 font-medium text-slate-50">
                    PIC
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
                ) : rooms.length ? (
                  rooms.map((room) => (
                    <tr
                      key={String(room.id)}
                      className="border-b last:border-b-0"
                    >
                      <td className="truncate px-3 py-2 font-medium">
                        {room.name}
                      </td>
                      <td className="truncate px-3 py-2">{room.number}</td>
                      <td className="px-3 py-2">{room.floor}</td>
                      <td className="px-3 py-2">{room.capacity}</td>
                      <td className="px-3 py-2">{room.description || "-"}</td>
                      <td className="truncate px-3 py-2 text-muted-foreground">
                        {room.picName}
                      </td>
                      <td className="sticky right-0 z-10 relative bg-card px-3 py-2 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              navigate(`/admin/inventarisasi/ruangan/${room.id}`, {
                                state: { from: location.pathname },
                              });
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={deleteCandidate?.id === room.id}
                            onOpenChange={(open) => {
                              if (open) {
                                setDeleteCandidate(room);
                                return;
                              }
                              if (deleteCandidate?.id === room.id)
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
                                  Hapus ruangan?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ruangan{" "}
                                  <span className="font-semibold">
                                    {room.name}
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
                                    void handleDelete(room);
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
                      Tidak ada data ruangan.
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
      <CreateRoomDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </section>
  );
}
type CreateRoomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

function CreateRoomDialog({ open, onOpenChange, onCreated }: CreateRoomDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    floor: "",
    capacity: "",
    description: "",
    picIds: [] as string[],
    imageFile: null as File | null,
  });
  const { picUsers, isLoading: isLoadingPics, error: picError } = usePicUsers();
  const { createRoom, isSubmitting, errorMessage, setErrorMessage } =
    useCreateRoom();

  const picOptions = useMemo(
    () => picUsers.map((user) => ({ value: user.id, label: user.name })),
    [picUsers],
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
      return setErrorMessage("Nama ruangan wajib diisi.");
    if (!formData.number.trim())
      return setErrorMessage("Nomor ruangan wajib diisi.");
    if (!formData.floor || Number(formData.floor) <= 0)
      return setErrorMessage("Lantai harus lebih dari 0.");
    if (!formData.capacity || Number(formData.capacity) <= 0) {
      return setErrorMessage("Kapasitas harus lebih dari 0.");
    }

    const result = await createRoom({
      name: formData.name,
      number: formData.number,
      floor: formData.floor,
      capacity: formData.capacity,
      description: formData.description,
      picIds: formData.picIds,
      imageFile: formData.imageFile,
    });

    if (result.ok) {
      onCreated();
      onOpenChange(false);
      toast.success("Ruangan berhasil ditambahkan.");
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
            number: "",
            floor: "",
            capacity: "",
            description: "",
            picIds: [],
            imageFile: null,
          });
        }
      }}
    >
      <DialogContent className="w-[min(720px,calc(100%-2rem))] max-w-none sm:max-w-none [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]">
        <DialogHeader>
          <DialogTitle>Tambah Ruangan</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-xs font-medium">Nama Ruangan</label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Contoh: Lab Kimia Dasar"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Nomor Ruangan</label>
            <Input
              name="number"
              value={formData.number}
              onChange={handleChange}
              placeholder="A101"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Lantai</label>
            <Input
              type="number"
              name="floor"
              value={formData.floor}
              onChange={handleChange}
              placeholder="1"
              min="1"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Kapasitas</label>
            <Input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              placeholder="32"
              min="1"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">PIC</label>
            <PicMultiSelect
              options={picOptions}
              selectedIds={formData.picIds}
              onChange={(nextIds) =>
                setFormData((prev) => ({ ...prev, picIds: nextIds }))
              }
              disabled={isLoadingPics}
            />
            {picError ? (
              <p className="text-xs text-destructive">{picError}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Deskripsi</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Deskripsi ruangan (opsional)"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Gambar Ruangan</label>
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
            {/* <p className="text-xs font-medium text-muted-foreground">Preview Gambar</p> */}
            <div className="overflow-hidden rounded-lg border bg-muted">
              <img src={previewUrl} alt="Preview ruangan" className="h-56 w-full object-cover" />
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
              {isSubmitting ? "Menyimpan..." : "Simpan Ruangan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DetailRoomPanelProps = {
  room: RoomRow | null;
  isDeleting: boolean;
  deleteErrorMessage: string;
  onDelete: (room: RoomRow) => Promise<void>;
  onUpdated: () => void;
  onClose: () => void;
};

type RoomDetailData = {
  id: string | number;
  name: string;
  number: string;
  floor: string;
  capacity: string;
  description: string;
  picIds: string[];
  picNames: string[];
  picName: string;
  imageId: string | number | null;
  imageUrl: string;
};

function DetailRoomPanel({
  room,
  isDeleting,
  deleteErrorMessage,
  onDelete,
  onUpdated,
  onClose,
}: DetailRoomPanelProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailRoom, setDetailRoom] = useState<RoomDetailData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    floor: "",
    capacity: "",
    description: "",
    picIds: [] as string[],
    imageId: null as string | number | null,
    imageFile: null as File | null,
  });
  const {
    picUsers,
    isLoading: isLoadingPics,
    error: picError,
  } = usePicUsers(isEditing);
  const {
    updateRoom,
    isSubmitting,
    errorMessage: updateErrorMessage,
    setErrorMessage: setUpdateErrorMessage,
  } = useUpdateRoom();

  const picOptions = useMemo(
    () => picUsers.map((user) => ({ value: user.id, label: user.name })),
    [picUsers],
  );
  const selectedPreviewUrl = useMemo(
    () => (formData.imageFile ? URL.createObjectURL(formData.imageFile) : ""),
    [formData.imageFile],
  );

  useEffect(() => {
    return () => {
      if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
    };
  }, [selectedPreviewUrl]);

  useEffect(() => {
    setIsEditing(false);
    setConfirmDeleteOpen(false);
    setUpdateErrorMessage("");
  }, [room?.id, setUpdateErrorMessage]);

  useEffect(() => {
    if (!room?.id) {
      setDetailRoom(null);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const loadDetail = async () => {
      setIsLoadingDetail(true);
      setDetailError("");

      try {
        const response = await authFetch(API_ROOM_DETAIL(room.id), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(`Gagal memuat detail ruangan (${response.status}).`);

        const data = (await response.json()) as {
          id?: string | number | null;
          name?: string | null;
          number?: string | null;
          floor?: string | number | null;
          capacity?: string | number | null;
          description?: string | null;
          pics?: Array<string | number | null> | null;
          pics_detail?: Array<{
            full_name?: string | null;
            email?: string | null;
          }> | null;
          image?: string | number | null;
          image_detail?: { url?: string | null } | null;
        };

        const picIds = Array.isArray(data.pics)
          ? data.pics
              .filter((item): item is string | number => item !== null && item !== undefined)
              .map((item) => String(item))
          : [];
        const picNames = Array.isArray(data.pics_detail)
          ? data.pics_detail
              .map((item) => String(item?.full_name ?? item?.email ?? "").trim())
              .filter(Boolean)
          : room.picName === "-" ? [] : room.picName.split(", ").filter(Boolean);

        const nextDetail: RoomDetailData = {
          id: data.id ?? room.id,
          name: String(data.name ?? room.name),
          number: String(data.number ?? room.number),
          floor: String(data.floor ?? room.floor),
          capacity: String(data.capacity ?? room.capacity),
          description: String(data.description ?? room.description ?? ""),
          picIds,
          picNames,
          picName: joinPicNames(picNames),
          imageId: data.image ?? null,
          imageUrl: resolveAssetUrl(data.image_detail?.url ?? ""),
        };

        setDetailRoom(nextDetail);
        setFormData({
          name: nextDetail.name,
          number: nextDetail.number,
          floor: nextDetail.floor,
          capacity: nextDetail.capacity,
          description: nextDetail.description,
          picIds: nextDetail.picIds,
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
        setDetailRoom({
          id: room.id,
          name: room.name,
          number: room.number,
          floor: room.floor,
          capacity: room.capacity,
          description: room.description,
          picIds: [],
          picNames: room.picName === "-" ? [] : room.picName.split(", ").filter(Boolean),
          picName: room.picName,
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
    room?.id,
    room?.name,
    room?.number,
    room?.floor,
    room?.capacity,
    room?.description,
    room?.picName,
  ]);

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
      setUpdateErrorMessage("Ukuran gambar maksimal 5MB.");
      return;
    }
    setUpdateErrorMessage("");
    setFormData((prev) => ({ ...prev, imageFile: file }));
  };

  const handleSave = async () => {
    if (!detailRoom) return;
    setUpdateErrorMessage("");

    if (!formData.name.trim())
      return setUpdateErrorMessage("Nama ruangan wajib diisi.");
    if (!formData.number.trim())
      return setUpdateErrorMessage("Nomor ruangan wajib diisi.");
    if (!formData.floor || Number(formData.floor) <= 0)
      return setUpdateErrorMessage("Lantai harus lebih dari 0.");
    if (!formData.capacity || Number(formData.capacity) <= 0) {
      return setUpdateErrorMessage("Kapasitas harus lebih dari 0.");
    }

    const result = await updateRoom(detailRoom.id, {
      name: formData.name,
      number: formData.number,
      floor: formData.floor,
      capacity: formData.capacity,
      description: formData.description,
      picIds: formData.picIds,
      imageId: formData.imageId,
      imageFile: formData.imageFile,
    });

    if (!result.ok) return;

    const responseData = result.data as
      | {
          image?: string | number | null;
          image_detail?: { url?: string | null } | null;
          pics?: Array<string | number | null> | null;
          pics_detail?: Array<{
            full_name?: string | null;
            email?: string | null;
          }> | null;
        }
      | undefined;

    const nextPicNames = Array.isArray(responseData?.pics_detail)
      ? responseData.pics_detail
          .map((item) => String(item?.full_name ?? item?.email ?? "").trim())
          .filter(Boolean)
      : picOptions
          .filter((option) => formData.picIds.includes(option.value))
          .map((option) => option.label);

    setDetailRoom((prev) =>
      prev
        ? {
            ...prev,
            name: formData.name.trim(),
            number: formData.number.trim(),
            floor: formData.floor,
            capacity: formData.capacity,
            description: formData.description.trim(),
            picIds: Array.isArray(responseData?.pics)
              ? responseData.pics
                  .filter((item): item is string | number => item !== null && item !== undefined)
                  .map((item) => String(item))
              : formData.picIds,
            picNames: nextPicNames,
            picName: joinPicNames(nextPicNames),
            imageId: responseData?.image ?? prev.imageId,
            imageUrl: resolveAssetUrl(
              responseData?.image_detail?.url ?? prev.imageUrl ?? "",
            ),
          }
        : prev,
    );
    setFormData((prev) => ({ ...prev, imageFile: null }));
    setIsEditing(false);
    onUpdated();
    toast.success("Ruangan berhasil diperbarui.");
  };

  if (!room) {
    return (
      <div className="max-h-[calc(100svh-7rem)] overflow-y-auto p-4">
        <PanelHeader title="Detail Ruangan" onClose={onClose} />
        <p className="text-sm text-muted-foreground">
          Pilih ruangan untuk melihat detail.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100svh-7rem)] space-y-4 overflow-y-auto p-4">
      <PanelHeader title="Detail Ruangan" onClose={onClose} />

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

      {detailRoom ? (
        <>
          <DetailField
            label="Nama Ruangan"
            value={isEditing ? formData.name : detailRoom.name}
            editable={isEditing}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, name: value }))
            }
          />
          <DetailField
            label="Nomor Ruangan"
            value={isEditing ? formData.number : detailRoom.number}
            editable={isEditing}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, number: value }))
            }
          />
          <DetailField
            label="Lantai"
            value={isEditing ? formData.floor : detailRoom.floor}
            editable={isEditing}
            type="number"
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, floor: value }))
            }
          />
          <DetailField
            label="Kapasitas"
            value={isEditing ? formData.capacity : detailRoom.capacity}
            editable={isEditing}
            type="number"
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, capacity: value }))
            }
          />
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">PIC</p>
            {isEditing ? (
              <PicMultiSelect
                options={picOptions}
                selectedIds={formData.picIds}
                onChange={(nextIds) =>
                  setFormData((prev) => ({ ...prev, picIds: nextIds }))
                }
                disabled={isLoadingPics}
              />
            ) : (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                {detailRoom.picName || "-"}
              </div>
            )}
            {picError ? (
              <p className="text-xs text-destructive">{picError}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Deskripsi
            </p>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            ) : (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                {detailRoom.description || "-"}
              </div>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Gambar Ruangan
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
          {selectedPreviewUrl || detailRoom.imageUrl ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Gambar
              </p>
              <div className="overflow-hidden rounded-lg border bg-muted">
                <img
                  src={selectedPreviewUrl || detailRoom.imageUrl}
                  alt="Preview ruangan"
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

      {detailRoom ? (
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
                  name: detailRoom.name,
                  number: detailRoom.number,
                  floor: detailRoom.floor,
                  capacity: detailRoom.capacity,
                  description: detailRoom.description,
                  picIds: detailRoom.picIds,
                  imageId: detailRoom.imageId,
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
            disabled={isSubmitting || isLoadingDetail || !detailRoom}
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
            disabled={isDeleting || isSubmitting || !detailRoom}
          >
            {isDeleting ? "Menghapus..." : "Hapus Ruangan"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>Hapus ruangan?</AlertDialogTitle>
            <AlertDialogDescription>
              Ruangan{" "}
              <span className="font-semibold">
                {detailRoom?.name ?? room.name}
              </span>{" "}
              akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start">
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting || !detailRoom}
              onClick={() => {
                if (detailRoom) void onDelete(detailRoom);
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
          {value}
        </div>
      )}
    </div>
  );
}
