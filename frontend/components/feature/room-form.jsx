"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePicUsers } from "@/hooks/use-pic-users";
import { useRoomActions } from "@/hooks/use-room-actions";
import { API_ROOM_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

const INITIAL_FORM = {
  name: "",
  capacity: "",
  description: "",
  number: "",
  floor: "",
  picId: "",
  imageFile: null,
  imageId: null,
  imageUrl: "",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function RoomForm({ roomId }) {
  const router = useRouter();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState("");
  const { picUsers, isLoading: isLoadingPics, error: picError } = usePicUsers();
  const { createRoom, updateRoom, isSubmitting, errorMessage: submitError } =
    useRoomActions();

  const picOptions = useMemo(() => {
    return picUsers.map((user) => ({
      value: user.profileId,
      label: `${user.name} (${user.role})`,
    }));
  }, [picUsers]);

  useEffect(() => {
    if (!roomId) return;
    const loadDetail = async () => {
      setErrorMessage("");
      try {
        const resp = await authFetch(API_ROOM_DETAIL(roomId));
        if (!resp.ok) throw new Error("Gagal memuat data ruangan.");
        const data = await resp.json();
        setFormData({
          name: data.name || "",
          capacity: data.capacity?.toString() || "",
          description: data.description || "",
          number: data.number || "",
          floor: data.floor?.toString() || "",
          picId: data.pic || "",
          imageFile: null,
          imageId: data.image || null,
          imageUrl: data.image_detail?.url || "",
        });
      } catch (error) {
        setErrorMessage(error.message || "Terjadi kesalahan.");
      }
    };

    loadDetail();
  }, [roomId]);

  useEffect(() => {
    if (submitError) setErrorMessage(submitError);
  }, [submitError]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_IMAGE_SIZE) {
      setErrorMessage("Ukuran gambar maksimal 5MB.");
      return;
    }
    setFormData((prev) => ({ ...prev, imageFile: file }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim()) {
      setErrorMessage("Nama ruangan wajib diisi.");
      return;
    }
    if (!formData.capacity || Number(formData.capacity) <= 0) {
      setErrorMessage("Kapasitas harus lebih dari 0.");
      return;
    }
    if (!formData.number.trim()) {
      setErrorMessage("Nomor ruangan wajib diisi.");
      return;
    }
    if (!formData.floor || Number(formData.floor) <= 0) {
      setErrorMessage("Lantai harus lebih dari 0.");
      return;
    }

    const payload = { ...formData };
    const result = roomId
      ? await updateRoom(roomId, payload)
      : await createRoom(payload);

    if (result.ok) {
      router.push("/room");
    }
  };

  return (
    <section className="space-y-4">
      <div className="mx-auto text-center">
        <p className="text-sm text-muted-foreground">
          {roomId
            ? "Perbarui data ruangan dan pilih PIC untuk pengelolaan."
            : "Lengkapi data ruangan dan pilih PIC untuk pengelolaan."}
        </p>
      </div>

      <div className="rounded-lg">
        <form
          className="mx-auto w-full max-w-xl space-y-4 rounded-lg border bg-card p-4 md:max-w-[55%]"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Nama Ruangan</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                placeholder="Contoh: Lab Kimia Dasar"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Nomor Ruangan</label>
              <input
                name="number"
                value={formData.number}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                placeholder="A101"
                maxLength={4}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Lantai</label>
              <input
                type="number"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                min="1"
                placeholder="1"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Kapasitas</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                min="1"
                placeholder="32"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">PIC</label>
              <select
                name="picId"
                value={formData.picId}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                disabled={isLoadingPics}
              >
                <option value="">
                  {isLoadingPics ? "Memuat PIC..." : "Pilih PIC"}
                </option>
                {picOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {picError ? (
                <p className="text-xs text-destructive">{picError}</p>
              ) : null}
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Deskripsi</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Deskripsi ruangan (opsional)"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Gambar Ruangan</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm">
                  <ImageIcon className="h-4 w-4" />
                  <span>
                    {formData.imageFile
                      ? formData.imageFile.name
                      : "Pilih gambar"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {formData.imageFile ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, imageFile: null }))
                    }
                  >
                    Hapus
                  </Button>
                ) : null}
              </div>
              {formData.imageFile ? (
                <div className="mt-3 overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={URL.createObjectURL(formData.imageFile)}
                    alt="Preview ruangan"
                    className="h-86 w-full object-cover"
                  />
                </div>
              ) : formData.imageUrl ? (
                <div className="mt-3 overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={formData.imageUrl}
                    alt="Preview ruangan"
                    className="h-86 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting
                ? "Menyimpan..."
                : roomId
                  ? "Perbarui Ruangan"
                  : "Simpan Ruangan"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default RoomForm;
