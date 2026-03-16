"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { API_BASE_URL, API_FACILITIES, API_FACILITY_DETAIL, API_IMAGES, API_IMAGE_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type Facility = {
  id: string | number;
  name: string;
  description: string;
  image?: string | number | null;
  image_detail?: {
    id?: string | number | null;
    url?: string | null;
  } | null;
};

type PaginatedResponse<T> = {
  results?: T[];
};

function normalizeResponse(payload: Facility[] | PaginatedResponse<Facility> | null) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function resolveAssetUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const detail = "detail" in payload ? payload.detail : null;
  if (typeof detail === "string" && detail.trim()) return detail;
  const firstEntry = Object.entries(payload).find(([, value]) => {
    if (typeof value === "string") return true;
    return Array.isArray(value) && typeof value[0] === "string";
  });
  if (!firstEntry) return fallback;
  const [, value] = firstEntry;
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return fallback;
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await authFetch(API_IMAGES, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json().catch(() => null)) as { id?: string | number } | Record<string, unknown> | null;
  if (!response.ok || !data || !("id" in data)) {
    throw new Error(getErrorMessage(data, "Gagal mengunggah gambar."));
  }

  return data.id as string | number;
}

export default function FacilityPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Facility | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [editTarget, setEditTarget] = useState<Facility | null>(null);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageId: null as string | number | null,
    imageUrl: "",
    imageFile: null as File | null,
  });

  const previewUrl = useMemo(
    () => (formData.imageFile ? URL.createObjectURL(formData.imageFile) : formData.imageUrl),
    [formData.imageFile, formData.imageUrl],
  );

  useEffect(() => {
    return () => {
      if (formData.imageFile && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [formData.imageFile, previewUrl]);

  const loadFacilities = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authFetch(API_FACILITIES, { method: "GET" });
      const data = (await response.json().catch(() => null)) as Facility[] | PaginatedResponse<Facility> | null;
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Gagal memuat fasilitas."));
      }
      setFacilities(normalizeResponse(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat fasilitas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFacilities();
  }, []);

  const resetForm = () => {
    setFormError("");
    setEditTarget(null);
    setFormData({
      name: "",
      description: "",
      imageId: null,
      imageUrl: "",
      imageFile: null,
    });
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (item: Facility) => {
    setEditTarget(item);
    setFormError("");
    setFormData({
      name: item.name || "",
      description: item.description || "",
      imageId: item.image ?? item.image_detail?.id ?? null,
      imageUrl: resolveAssetUrl(item.image_detail?.url ?? ""),
      imageFile: null,
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_IMAGE_SIZE) {
      setFormError("Ukuran gambar maksimal 5MB.");
      return;
    }
    setFormError("");
    setFormData((prev) => ({ ...prev, imageFile: file }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Nama fasilitas wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      let nextImageId = formData.imageId;
      if (formData.imageFile) {
        nextImageId = await uploadImage(formData.imageFile);
      }

      const payload: Record<string, string | number | null> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: nextImageId ?? null,
      };

      const response = await authFetch(
        editTarget ? API_FACILITY_DETAIL(editTarget.id) : API_FACILITIES,
        {
          method: editTarget ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => null)) as Facility | Record<string, unknown> | null;
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            editTarget ? "Gagal memperbarui fasilitas." : "Gagal menambahkan fasilitas.",
          ),
        );
      }

      if (
        editTarget &&
        formData.imageId &&
        (
          !nextImageId ||
          String(formData.imageId) !== String(nextImageId)
        )
      ) {
        try {
          await authFetch(API_IMAGE_DETAIL(formData.imageId), { method: "DELETE" });
        } catch {
          // ignore cleanup failure
        }
      }

      await loadFacilities();
      setIsDialogOpen(false);
      toast.success(
        editTarget ? "Fasilitas berhasil diperbarui." : "Fasilitas berhasil ditambahkan.",
      );
      resetForm();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : editTarget
            ? "Terjadi kesalahan saat memperbarui fasilitas."
            : "Terjadi kesalahan saat menambahkan fasilitas.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      const response = await authFetch(API_FACILITY_DETAIL(deleteTarget.id), {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Gagal menghapus fasilitas."));
      }

      if (deleteTarget.image) {
        try {
          await authFetch(API_IMAGE_DETAIL(deleteTarget.image), { method: "DELETE" });
        } catch {
          // ignore cleanup failure
        }
      } else if (deleteTarget.image_detail?.id) {
        try {
          await authFetch(API_IMAGE_DETAIL(deleteTarget.image_detail.id), { method: "DELETE" });
        } catch {
          // ignore cleanup failure
        }
      }

      setDeleteTarget(null);
      await loadFacilities();
      toast.success("Fasilitas berhasil dihapus.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus fasilitas.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Fasilitas" : "Tambah Fasilitas"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? `Perbarui data fasilitas ${editTarget.name}.`
                : "Tambahkan fasilitas yang akan ditampilkan pada profil laboratorium."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Nama Fasilitas</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Contoh: Area Diskusi"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Deskripsi</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Jelaskan fasilitas secara singkat"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Gambar</label>
              <label className="group flex cursor-pointer items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm hover:border-primary/50">
                <span className="truncate text-muted-foreground">
                  {formData.imageFile
                    ? formData.imageFile.name
                    : formData.imageUrl
                      ? "Ganti gambar fasilitas"
                      : "Pilih gambar (opsional)"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                {formData.imageFile || formData.imageUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        imageId: null,
                        imageUrl: "",
                        imageFile: null,
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </label>
            </div>

            {previewUrl ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img src={previewUrl} alt="Preview fasilitas" className="h-56 w-full object-cover" />
              </div>
            ) : null}

            {formError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleDialogChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Tambah Fasilitas"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>Hapus fasilitas?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Fasilitas ${deleteTarget.name} akan dihapus permanen.`
                : "Data fasilitas ini akan dihapus."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start">
            <AlertDialogCancel disabled={deletingId != null}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletingId != null}
              onClick={() => void handleDelete()}
            >
              {deletingId != null ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminPageHeader
        title="Fasilitas"
        description="Kelola daftar fasilitas laboratorium yang ditampilkan pada profil admin."
        icon={<Building2 className="h-5 w-5 text-sky-200" />}
        actions={
          <Button
            type="button"
            size="sm"
            className="bg-white text-slate-900 hover:bg-slate-100"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Tambah Fasilitas
          </Button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-sm text-slate-500">
          Memuat data fasilitas...
        </div>
      ) : facilities.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {facilities.map((item) => (
            <article
              key={String(item.id)}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
            >
              {item.image_detail?.url ? (
                <div className="h-48 overflow-hidden border-b border-slate-200 bg-slate-100">
                  <img
                    src={resolveAssetUrl(item.image_detail.url)}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center border-b border-slate-200 bg-slate-100 text-slate-400">
                  <Building2 className="h-10 w-10" />
                </div>
              )}

              <div className="space-y-4 p-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{item.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.description || "-"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-sm text-slate-500">
          Belum ada data fasilitas. Tambahkan fasilitas pertama untuk mulai mengisi profil laboratorium.
        </div>
      )}
    </section>
  );
}
