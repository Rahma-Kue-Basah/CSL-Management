"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EQUIPMENT_CATEGORY_OPTIONS, MOVEABLE_OPTIONS } from "@/constants/equipments";
import { useRoomOptions } from "@/hooks/use-room-options";
import { useCreateEquipment } from "@/hooks/use-create-equipment";

const INITIAL_FORM = {
  name: "",
  description: "",
  quantity: "",
  category: "",
  roomId: "",
  isMoveable: "true",
  imageFile: null,
};

export default function EquipmentFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const { rooms, isLoading: isLoadingRooms, error: roomError } =
    useRoomOptions();
  const { createEquipment, isSubmitting, errorMessage, setErrorMessage } =
    useCreateEquipment();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, imageFile: file }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim()) {
      setErrorMessage("Nama equipment wajib diisi.");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setErrorMessage("Jumlah harus lebih dari 0.");
      return;
    }
    if (!formData.category) {
      setErrorMessage("Kategori wajib dipilih.");
      return;
    }
    if (!formData.roomId) {
      setErrorMessage("Ruangan wajib dipilih.");
      return;
    }

    const payload = {
      ...formData,
      isMoveable: formData.isMoveable === "true",
    };

    const result = await createEquipment(payload);
    if (result.ok) {
      router.push("/equipment");
    }
  };

  return (
    <section className="space-y-4">
      <div className="mx-auto text-center">
        <p className="text-sm text-muted-foreground">
          Lengkapi data equipment dan pilih ruangan penempatan.
        </p>
      </div>

      <div className="rounded-lg">
        <form
          className="mx-auto w-full max-w-xl space-y-4 rounded-lg border bg-card p-4 md:max-w-[55%]"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Nama Equipment</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                placeholder="Contoh: Mikroskop"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Jumlah</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                min="1"
                placeholder="1"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Kategori</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                required
              >
                <option value="">Pilih kategori</option>
                {EQUIPMENT_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Ruangan</label>
              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                disabled={isLoadingRooms}
                required
              >
                <option value="">
                  {isLoadingRooms ? "Memuat ruangan..." : "Pilih ruangan"}
                </option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.label}
                  </option>
                ))}
              </select>
              {roomError ? (
                <p className="text-xs text-destructive">{roomError}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Moveable</label>
              <select
                name="isMoveable"
                value={formData.isMoveable}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {MOVEABLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Deskripsi</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Deskripsi equipment (opsional)"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Gambar Equipment</label>
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
                    alt="Preview equipment"
                    className="h-44 w-full object-cover"
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
              {isSubmitting ? "Menyimpan..." : "Simpan Equipment"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
