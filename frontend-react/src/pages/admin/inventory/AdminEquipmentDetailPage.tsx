import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { ArrowLeft, Loader2, Trash2, Wrench } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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
  EQUIPMENT_CATEGORY_OPTIONS,
  MOVEABLE_OPTIONS,
} from "@/constants/equipments";
import { API_BASE_URL, API_EQUIPMENT_DETAIL } from "@/constants/api";
import { useDeleteEquipment } from "@/hooks/equipments/use-delete-equipment";
import { useUpdateEquipment } from "@/hooks/equipments/use-update-equipment";
import { useRoomOptions } from "@/hooks/rooms/use-room-options";
import { authFetch } from "@/lib/auth";
import { toast } from "sonner";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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

function resolveAssetUrl(value: string | null | undefined) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

function formatStatus(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
}

function DetailField({
  label,
  value,
  editable = false,
  onChange,
  type = "text",
  onView,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  type?: "text" | "number";
  onView?: (() => void) | undefined;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-700">{label}</p>
      {editable ? (
        <Input
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className="border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
        />
      ) : onView ? (
        <button
          type="button"
          onClick={onView}
          className="w-full rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-left text-sm text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
        >
          {value || "-"}
        </button>
      ) : (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
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
      <p className="text-xs font-medium text-slate-700">{label}</p>
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-9 w-full rounded-md border border-sky-300 bg-sky-50/60 px-3 text-sm shadow-sm outline-none focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-200"
        disabled={disabled}
      >
        <option value="">{placeholder || `Pilih ${label.toLowerCase()}`}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function AdminEquipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo =
    typeof location.state?.from === "string"
      ? location.state.from
      : "/admin/inventory/equipment";

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailItem, setDetailItem] = useState<EquipmentDetailData | null>(null);
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
  const { rooms, isLoading: isLoadingRooms, error: roomError } = useRoomOptions();
  const {
    updateEquipment,
    isSubmitting,
    errorMessage: updateErrorMessage,
    setErrorMessage: setUpdateErrorMessage,
  } = useUpdateEquipment();
  const {
    deleteEquipment,
    isDeleting,
    errorMessage: deleteErrorMessage,
    setErrorMessage: setDeleteErrorMessage,
  } = useDeleteEquipment();

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
    if (!id) {
      setDetailError("ID peralatan tidak ditemukan.");
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const loadDetail = async () => {
      setIsLoadingDetail(true);
      setDetailError("");

      try {
        const response = await authFetch(API_EQUIPMENT_DETAIL(id), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat detail peralatan (${response.status}).`);
        }

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
          id: data.id ?? id,
          name: String(data.name ?? "-"),
          quantity: String(data.quantity ?? "-"),
          category: String(data.category ?? "-"),
          status: String(data.status ?? "-"),
          roomId: String(data.room ?? ""),
          roomName: String(data.room_detail?.name ?? "-"),
          isMoveable: Boolean(data.is_moveable),
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
        if (error instanceof DOMException && error.name === "AbortError") return;
        setDetailError(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memuat detail peralatan.",
        );
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
  }, [id]);

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

    if (!formData.name.trim()) return setUpdateErrorMessage("Nama peralatan wajib diisi.");
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      return setUpdateErrorMessage("Jumlah harus lebih dari 0.");
    }
    if (!formData.category) return setUpdateErrorMessage("Kategori wajib dipilih.");
    if (!formData.roomId) return setUpdateErrorMessage("Ruangan wajib dipilih.");

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
                roomOptions.find((opt) => opt.value === formData.roomId)?.label ??
                prev.roomName,
            ),
            isMoveable: formData.isMoveable === "true",
            description: formData.description.trim(),
            imageId: responseData?.image ?? prev.imageId,
            imageUrl: resolveAssetUrl(responseData?.image_detail?.url ?? prev.imageUrl),
          }
        : prev,
    );
    setFormData((prev) => ({ ...prev, imageFile: null }));
    setIsEditing(false);
    toast.success("Peralatan berhasil diperbarui.");
  };

  const handleDelete = async () => {
    if (!detailItem) return;
    setDeleteErrorMessage("");
    const result = await deleteEquipment(detailItem.id);
    if (!result.ok) return;
    setConfirmDeleteOpen(false);
    toast.success("Peralatan berhasil dihapus.");
    navigate(backTo, { replace: true });
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      {detailError ? (
        <div className="mx-auto max-w-3xl rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {detailError}
        </div>
      ) : null}

      {isLoadingDetail ? (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card px-4 py-10">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Memuat detail peralatan...</span>
          </div>
        </div>
      ) : !detailItem ? (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
          Data peralatan tidak ditemukan.
        </div>
      ) : (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              
              <div>
                <p className="text-base font-semibold text-slate-900">Detail Peralatan</p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(backTo)}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <DetailField
              label="Nama"
              value={isEditing ? formData.name : detailItem.name}
              editable={isEditing}
              onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
            />
            <DetailField
              label="Jumlah"
              value={isEditing ? formData.quantity : detailItem.quantity}
              editable={isEditing}
              type="number"
              onChange={(value) => setFormData((prev) => ({ ...prev, quantity: value }))}
            />
            <SelectDetailField
              label="Kategori"
              value={isEditing ? formData.category : detailItem.category}
              editable={isEditing}
              options={EQUIPMENT_CATEGORY_OPTIONS}
              onChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            />
            {isEditing ? (
              <SelectDetailField
                label="Ruangan"
                value={formData.roomId}
                editable
                options={roomOptions}
                onChange={(value) => setFormData((prev) => ({ ...prev, roomId: value }))}
                placeholder={isLoadingRooms ? "Memuat ruangan..." : "Pilih ruangan"}
                disabled={isLoadingRooms}
              />
            ) : (
              <DetailField
                label="Ruangan"
                value={detailItem.roomName}
                onView={
                  detailItem.roomId
                    ? () =>
                        navigate(`/admin/inventory/rooms/${detailItem.roomId}`, {
                          state: { from: location.pathname },
                        })
                    : undefined
                }
              />
            )}
            {roomError ? <p className="text-xs text-destructive">{roomError}</p> : null}
            <SelectDetailField
              label="Moveable"
              value={isEditing ? formData.isMoveable : detailItem.isMoveable ? "Ya" : "Tidak"}
              editable={isEditing}
              options={MOVEABLE_OPTIONS}
              onChange={(value) => setFormData((prev) => ({ ...prev, isMoveable: value }))}
            />
            <DetailField label="Status" value={formatStatus(detailItem.status)} />

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-700">Deskripsi</p>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-sky-300 bg-sky-50/60 px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-200"
                />
              ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {detailItem.description || "-"}
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">Gambar</p>
                <label className="group flex cursor-pointer items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm hover:border-primary/50">
                  <span className="truncate text-muted-foreground">
                    {formData.imageFile ? formData.imageFile.name : "Pilih gambar (opsional)"}
                  </span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                  {formData.imageFile ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      onClick={() => setFormData((prev) => ({ ...prev, imageFile: null }))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </label>
              </div>
            ) : null}

            {previewUrl || detailItem.imageUrl ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">Gambar</p>
                <div className="overflow-hidden rounded-lg border bg-muted">
                  <img src={previewUrl || detailItem.imageUrl} alt="Preview peralatan" className="h-56 w-full object-cover" />
                </div>
              </div>
            ) : null}
          </div>

          {updateErrorMessage ? (
            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {updateErrorMessage}
            </div>
          ) : null}
          {deleteErrorMessage ? (
            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteErrorMessage}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {isEditing ? (
              <Button
                type="button"
                variant="outline"
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
                disabled={isSubmitting}
              >
                Batal
              </Button>
            ) : null}
            <Button
              type="button"
              variant={isEditing ? "default" : "outline"}
              className={isEditing ? "bg-[#0052C7] text-white hover:bg-[#0048B4]" : ""}
              disabled={isSubmitting || isLoadingDetail}
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

            {!isEditing ? (
              <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isDeleting || isSubmitting}>
                    {isDeleting ? "Menghapus..." : "Hapus Peralatan"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader className="place-items-start text-left">
                    <AlertDialogTitle>Hapus peralatan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Peralatan <span className="font-semibold">{detailItem.name}</span> akan dihapus.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="sm:justify-start">
                    <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={() => void handleDelete()}>
                      {isDeleting ? "Menghapus..." : "Hapus"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
