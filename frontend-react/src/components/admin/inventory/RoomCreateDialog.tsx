"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { MapPinned, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PicMultiSelect } from "@/components/admin/inventory/PicMultiSelect";
import AdminDetailDialogShell from "@/components/shared/AdminDetailDialogShell";
import InlineErrorAlert from "@/components/shared/InlineErrorAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { useCreateRoom } from "@/hooks/shared/resources/rooms/use-create-room";
import { usePicUsers } from "@/hooks/shared/resources/users/use-pic-users";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type RoomCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export default function RoomCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: RoomCreateDialogProps) {
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
  const { createRoom, isSubmitting, errorMessage, setErrorMessage } = useCreateRoom();

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

  const resetForm = () => {
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
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
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

    if (!formData.name.trim()) return setErrorMessage("Nama ruangan wajib diisi.");
    if (!formData.number.trim()) return setErrorMessage("Nomor ruangan wajib diisi.");
    if (!formData.floor.trim()) return setErrorMessage("Lantai wajib diisi.");
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
      resetForm();
      toast.success("Ruangan berhasil ditambahkan.");
    }
  };

  return (
    <AdminDetailDialogShell
      open={open}
      onOpenChange={onOpenChange}
      onCloseReset={resetForm}
      title="Tambah Ruangan"
      description="Tambahkan data ruangan baru untuk inventaris laboratorium."
      icon={<MapPinned className="h-5 w-5" />}
      contentClassName="w-[min(720px,calc(100%-2rem))] max-w-none gap-0 p-0 sm:max-w-none [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]"
    >
      <form className="space-y-4 px-5 py-4 sm:px-6" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium">Nama Ruangan</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Lab Kimia Dasar"
              className="border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
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
                className="border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Lantai</label>
              <Input
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                placeholder="Contoh: 1 / Ground / Mezzanine"
                className="border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
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
                className="border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
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
              {picError ? <p className="text-xs text-destructive">{picError}</p> : null}
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
              className="w-full rounded-md border border-sky-300 bg-sky-50/60 px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Gambar Ruangan</label>
            <label className="group flex cursor-pointer items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm hover:border-primary/50">
              <span className="truncate text-muted-foreground">
                {formData.imageFile ? formData.imageFile.name : "Pilih gambar (opsional)"}
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
                  aria-label="Hapus gambar yang diunggah"
                  className="rounded-full text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                  onClick={() => setFormData((prev) => ({ ...prev, imageFile: null }))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </label>
          </div>

          {previewUrl ? (
            <div className="space-y-1">
              <div className="overflow-hidden rounded-lg border bg-muted">
                <img src={previewUrl} alt="Preview ruangan" className="h-56 w-full object-cover" />
              </div>
            </div>
          ) : null}

          {errorMessage ? <InlineErrorAlert>{errorMessage}</InlineErrorAlert> : null}

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
    </AdminDetailDialogShell>
  );
}
