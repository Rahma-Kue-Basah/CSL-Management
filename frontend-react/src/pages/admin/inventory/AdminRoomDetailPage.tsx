import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ArrowLeft, DoorOpen, Loader2, Trash2 } from "lucide-react";
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
import { PicMultiSelect } from "@/components/admin/inventory/PicMultiSelect";
import { API_BASE_URL, API_ROOM_DETAIL } from "@/constants/api";
import { useDeleteRoom } from "@/hooks/rooms/use-delete-room";
import { useUpdateRoom } from "@/hooks/rooms/use-update-room";
import { usePicUsers } from "@/hooks/users/use-pic-users";
import { authFetch } from "@/lib/auth";
import { toast } from "sonner";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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

function resolveAssetUrl(value: string | null | undefined) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

function joinPicNames(names: string[]) {
  return names.length ? names.join(", ") : "-";
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

export default function AdminRoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo =
    typeof location.state?.from === "string"
      ? location.state.from
      : "/admin/inventarisasi/ruangan";

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
  const {
    deleteRoom,
    isDeleting,
    errorMessage: deleteErrorMessage,
    setErrorMessage: setDeleteErrorMessage,
  } = useDeleteRoom();

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
    if (!id) {
      setDetailError("ID ruangan tidak ditemukan.");
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const loadDetail = async () => {
      setIsLoadingDetail(true);
      setDetailError("");

      try {
        const response = await authFetch(API_ROOM_DETAIL(id), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat detail ruangan (${response.status}).`);
        }

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
          : [];

        const nextDetail: RoomDetailData = {
          id: data.id ?? id,
          name: String(data.name ?? "-"),
          number: String(data.number ?? "-"),
          floor: String(data.floor ?? "-"),
          capacity: String(data.capacity ?? "-"),
          description: String(data.description ?? ""),
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
            : "Terjadi kesalahan saat memuat detail ruangan.",
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
    if (!detailRoom) return;
    setUpdateErrorMessage("");

    if (!formData.name.trim())
      return setUpdateErrorMessage("Nama ruangan wajib diisi.");
    if (!formData.number.trim())
      return setUpdateErrorMessage("Nomor ruangan wajib diisi.");
    if (!formData.floor || Number(formData.floor) <= 0) {
      return setUpdateErrorMessage("Lantai harus lebih dari 0.");
    }
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
              responseData?.image_detail?.url ?? prev.imageUrl,
            ),
          }
        : prev,
    );
    setFormData((prev) => ({ ...prev, imageFile: null }));
    setIsEditing(false);
    toast.success("Ruangan berhasil diperbarui.");
  };

  const handleDelete = async () => {
    if (!detailRoom) return;
    setDeleteErrorMessage("");
    const result = await deleteRoom(detailRoom.id);
    if (!result.ok) return;
    setConfirmDeleteOpen(false);
    toast.success("Ruangan berhasil dihapus.");
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
            <span className="text-sm">Memuat detail ruangan...</span>
          </div>
        </div>
      ) : !detailRoom ? (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
          Data ruangan tidak ditemukan.
        </div>
      ) : (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  Detail Ruangan
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(backTo)}
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
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
              <p className="text-xs font-medium text-slate-700">PIC</p>
              {isEditing ? (
                <PicMultiSelect
                  options={picOptions}
                  selectedIds={formData.picIds}
                  onChange={(nextIds) =>
                    setFormData((prev) => ({
                      ...prev,
                      picIds: nextIds,
                    }))
                  }
                  disabled={isLoadingPics}
                />
              ) : (
                <div className="space-y-2">
                  {detailRoom.picIds.length ? (
                    detailRoom.picIds.map((picId, index) => (
                      <button
                        key={`${picId}-${index}`}
                        type="button"
                        onClick={() =>
                          navigate(`/admin/user-management/detail/${picId}`, {
                            state: { from: location.pathname },
                          })
                        }
                        className="w-full rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-left text-sm text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                      >
                        {detailRoom.picNames[index] ?? "PIC"}
                      </button>
                    ))
                  ) : (
                    <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700">
                      -
                    </div>
                  )}
                </div>
              )}
              {picError ? (
                <p className="text-xs text-destructive">{picError}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-700">Deskripsi</p>
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
                  className="w-full rounded-md border border-sky-300 bg-sky-50/60 px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-200"
                />
              ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {detailRoom.description || "-"}
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">
                  Gambar Ruangan
                </p>
                <label className="group flex cursor-pointer items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm hover:border-primary/50">
                  <span className="truncate text-muted-foreground">
                    {formData.imageFile
                      ? formData.imageFile.name
                      : "Pilih gambar (opsional)"}
                  </span>
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
            ) : null}

            {selectedPreviewUrl || detailRoom.imageUrl ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">Gambar</p>
                <div className="overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={selectedPreviewUrl || detailRoom.imageUrl}
                    alt="Preview ruangan"
                    className="h-56 w-full object-cover"
                  />
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
                disabled={isSubmitting}
              >
                Batal
              </Button>
            ) : null}
            <Button
              type="button"
              variant={isEditing ? "default" : "outline"}
              className={
                isEditing ? "bg-[#0052C7] text-white hover:bg-[#0048B4]" : ""
              }
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
              <AlertDialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isDeleting || isSubmitting}
                  >
                    {isDeleting ? "Menghapus..." : "Hapus Ruangan"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader className="place-items-start text-left">
                    <AlertDialogTitle>Hapus ruangan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ruangan{" "}
                      <span className="font-semibold">{detailRoom.name}</span>{" "}
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
                      onClick={() => void handleDelete()}
                    >
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
