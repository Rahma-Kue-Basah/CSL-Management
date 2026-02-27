"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Image as ImageIcon,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  User2,
} from "lucide-react";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/constants/api";
import {
  useAnnouncements,
  type Announcement,
} from "@/hooks/announcements/use-announcements";
import { useCreateAnnouncement } from "@/hooks/announcements/use-create-announcement";
import { useUpdateAnnouncement } from "@/hooks/announcements/use-update-announcement";
import { useDeleteAnnouncement } from "@/hooks/announcements/use-delete-announcement";

function resolveImageUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

function truncateText(value: string, length = 180) {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trim()}...`;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getDateKey(value?: string | null) {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(value?: string | null) {
  if (!value) return "Tanggal tidak diketahui";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const today = new Date();
  const isSameDate =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isSameDate) return "Hari ini";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

const FALLBACK_TONES = [
  "from-emerald-200 via-emerald-100 to-emerald-50",
  "from-sky-200 via-sky-100 to-sky-50",
  "from-amber-200 via-amber-100 to-amber-50",
  "from-rose-200 via-rose-100 to-rose-50",
  "from-violet-200 via-violet-100 to-violet-50",
  "from-cyan-200 via-cyan-100 to-cyan-50",
];

function getFallbackTone(value: string | number) {
  const raw = String(value);
  let total = 0;
  for (let index = 0; index < raw.length; index += 1) {
    total += raw.charCodeAt(index);
  }
  return FALLBACK_TONES[total % FALLBACK_TONES.length];
}

export default function AdminPengumumanPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    announcements,
    setAnnouncements,
    isLoading,
    error: errorMessage,
    setError: setErrorMessage,
    endpoint: announcementEndpoint,
    setEndpoint: setAnnouncementEndpoint,
  } = useAnnouncements();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    createAnnouncement,
    isSubmitting,
    errorMessage: formError,
    setErrorMessage: setFormError,
  } = useCreateAnnouncement();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const {
    updateAnnouncement,
    isSubmitting: isEditing,
    errorMessage: editError,
    setErrorMessage: setEditError,
  } = useUpdateAnnouncement();
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const { deleteAnnouncement, isDeleting } = useDeleteAnnouncement();

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setFormError("");
      setFormData({ title: "", content: "" });
    }
  };

  const handleEditOpen = (announcement: Announcement) => {
    setEditTarget(announcement);
    setEditForm({
      title: announcement.title || "",
      content: announcement.content || "",
    });
    setEditError("");
  };

  const handleEditClose = () => {
    setEditTarget(null);
    setEditForm({ title: "", content: "" });
    setEditError("");
  };

  const handleFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAnnouncement = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError("");

    const title = formData.title.trim();
    const content = formData.content.trim();

    if (!title) {
      setFormError("Judul wajib diisi.");
      return;
    }

    if (!content) {
      setFormError("Isi pengumuman wajib diisi.");
      return;
    }

    try {
      const result = await createAnnouncement(
        { title, content },
        announcementEndpoint,
      );

      if (!result.ok) return;

      if (result.endpoint && result.endpoint !== announcementEndpoint) {
        setAnnouncementEndpoint(result.endpoint);
      }

      if (result.data) {
        setAnnouncements((prev) => [result.data as Announcement, ...prev]);
      }

      setFormData({ title: "", content: "" });
      setIsDialogOpen(false);
    } finally {
      // handled in hook
    }
  };

  const handleEditChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    setEditError("");

    const title = editForm.title.trim();
    const content = editForm.content.trim();

    if (!title) {
      setEditError("Judul wajib diisi.");
      return;
    }

    if (!content) {
      setEditError("Isi pengumuman wajib diisi.");
      return;
    }

    try {
      const result = await updateAnnouncement(
        editTarget.id,
        { title, content },
        announcementEndpoint,
      );

      if (!result.ok) return;

      if (result.endpoint && result.endpoint !== announcementEndpoint) {
        setAnnouncementEndpoint(result.endpoint);
      }

      if (result.data) {
        setAnnouncements((prev) =>
          prev.map((item) =>
            item.id === result.data?.id ? (result.data as Announcement) : item,
          ),
        );
      }

      handleEditClose();
    } finally {
      // handled in hook
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteAnnouncement(
        deleteTarget.id,
        announcementEndpoint,
      );

      if (!result.ok) {
        setErrorMessage(result.message || "Gagal menghapus pengumuman.");
        return;
      }

      if (result.endpoint && result.endpoint !== announcementEndpoint) {
        setAnnouncementEndpoint(result.endpoint);
      }

      setAnnouncements((prev) =>
        prev.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } finally {
      // handled in hook
    }
  };

  const filteredAnnouncements = useMemo(() => {
    const query = normalizeText(searchQuery);
    if (!query) return announcements;
    return announcements.filter((announcement) => {
      const title = normalizeText(announcement.title || "");
      const content = normalizeText(announcement.content || "");
      return title.includes(query) || content.includes(query);
    });
  }, [announcements, searchQuery]);

  const groupedAnnouncements = useMemo(() => {
    const sorted = [...filteredAnnouncements].sort((first, second) => {
      const firstDate = first.created_at ? new Date(first.created_at).getTime() : 0;
      const secondDate = second.created_at ? new Date(second.created_at).getTime() : 0;
      return secondDate - firstDate;
    });

    const map = new Map<string, Announcement[]>();
    sorted.forEach((item) => {
      const key = getDateKey(item.created_at);
      const existing = map.get(key);
      if (existing) {
        existing.push(item);
      } else {
        map.set(key, [item]);
      }
    });
    return Array.from(map.entries());
  }, [filteredAnnouncements]);

  const totalAnnouncements = announcements.length;
  const announcementsWithImages = announcements.filter(
    (announcement) => announcement.image_detail?.url,
  ).length;
  const announcementsWithoutImages = totalAnnouncements - announcementsWithImages;

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <AdminPageHeader
        title="Pengumuman"
        description="Kelola informasi terbaru untuk semua pengguna CSL."
        icon={<Megaphone className="h-5 w-5 text-sky-100" />}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                className="bg-white text-slate-900 hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                Tambah Pengumuman
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Buat Pengumuman Baru</DialogTitle>
                <DialogDescription>
                  Pastikan judul singkat dan isi pengumuman jelas.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleCreateAnnouncement}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Judul
                  </label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Contoh: Maintenance jaringan Jumat"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Isi Pengumuman
                  </label>
                  <Textarea
                    name="content"
                    value={formData.content}
                    onChange={handleFormChange}
                    placeholder="Tulis detail pengumuman yang akan ditampilkan."
                    rows={6}
                  />
                </div>
                {formError ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {formError}
                  </div>
                ) : null}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Menyimpan..." : "Simpan Pengumuman"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => (!open ? handleEditClose() : null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Pengumuman</DialogTitle>
            <DialogDescription>
              Perbarui judul dan isi pengumuman yang akan tampil di halaman publik.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Judul</label>
              <Input
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                placeholder="Judul pengumuman"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Isi Pengumuman
              </label>
              <Textarea
                name="content"
                value={editForm.content}
                onChange={handleEditChange}
                placeholder="Tulis detail pengumuman"
                rows={6}
              />
            </div>
            {editError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {editError}
              </div>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleEditClose}>
                Batal
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengumuman?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengumuman yang dihapus tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAnnouncement}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="relative overflow-hidden rounded-xl border bg-white p-5">
        <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-sky-500/10 blur-2xl" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari judul atau isi pengumuman"
                className="h-6 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
            {searchQuery ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-slate-600"
                onClick={() => setSearchQuery("")}
              >
                Hapus Filter
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">
              {totalAnnouncements} Pengumuman
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              {announcementsWithImages} Dengan Visual
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              {announcementsWithoutImages} Tanpa Gambar
            </span>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="space-y-6">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={`announcement-skeleton-${index}`} className="space-y-3">
                <Skeleton className="h-4 w-40" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((__, rowIndex) => (
                    <Skeleton key={rowIndex} className="h-10 w-full" />
                  ))}
                </div>
              </div>
            ))
          : groupedAnnouncements.map(([dateKey, items]) => {
              const label = formatDateLabel(
                dateKey === "unknown" ? null : `${dateKey}T00:00:00`,
              );
              return (
                <div key={dateKey} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-800">
                      {label}
                    </span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="space-y-2">
                    {items.map((announcement) => {
                      const imageUrl = resolveImageUrl(
                        announcement.image_detail?.url || "",
                      );
                      const creatorName =
                        announcement.created_by_detail?.full_name ||
                        announcement.created_by_detail?.email ||
                        "Admin";
                      const content = announcement.content || "";
                      const timeLabel = formatTime(announcement.created_at);
                      const fallbackTone = getFallbackTone(announcement.id);

                      return (
                        <div
                          key={announcement.id}
                          className="group flex min-w-0 items-center gap-3 rounded-md border bg-white px-3 py-4 shadow-xs transition hover:border-slate-300 hover:shadow-sm"
                        >
                          <div className="relative h-14 w-14 overflow-hidden rounded-md bg-slate-100">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={announcement.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div
                                className={`h-full w-full bg-linear-to-br ${fallbackTone}`}
                              />
                            )}
                            {!imageUrl ? (
                              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate-600/80">
                                <ImageIcon className="h-3 w-3" />
                              </div>
                            ) : null}
                          </div>
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-base font-semibold text-slate-900">
                                {announcement.title}
                              </p>
                              <p className="truncate text-sm text-slate-500">
                                {truncateText(content, 120)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                              <User2 className="h-3.5 w-3.5" />
                              <span className="max-w-[120px] truncate">
                                {creatorName}
                              </span>
                            </div>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {timeLabel}
                            </span>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-slate-600 hover:text-slate-900"
                                onClick={() => handleEditOpen(announcement)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-rose-600 hover:text-rose-700"
                                onClick={() => setDeleteTarget(announcement)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
      </div>

      {!isLoading && filteredAnnouncements.length === 0 && !errorMessage ? (
        <div className="rounded-xl border border-dashed bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Belum ada pengumuman yang sesuai dengan filter. Coba kata kunci lain.
        </div>
      ) : null}
    </section>
  );
}
