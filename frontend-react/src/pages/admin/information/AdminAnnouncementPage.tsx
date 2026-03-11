"use client";

import { useMemo, useState, type FormEvent } from "react";
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
import { InventoryFilterCard } from "@/components/admin/inventory/inventory-filter-card";
import {
  AnnouncementCreateDialog,
  AnnouncementEditDialog,
} from "@/components/admin/pengumuman/announcement-dialogs";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/constants/api";
import {
  useAnnouncements,
  type Announcement,
} from "@/hooks/announcements/use-announcements";
import { useCreateAnnouncement } from "@/hooks/announcements/use-create-announcement";
import { useUpdateAnnouncement } from "@/hooks/announcements/use-update-announcement";
import { useDeleteAnnouncement } from "@/hooks/announcements/use-delete-announcement";
import { formatDateKey, parseDateKey } from "@/lib/date";

function resolveImageUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function stripHtmlTags(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
  const [dateFilter, setDateFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
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

  const handleCreateAnnouncement = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError("");

    const title = formData.title.trim();
    const content = formData.content.trim();
    const plainContent = stripHtmlTags(content);

    if (!title) {
      setFormError("Judul wajib diisi.");
      return;
    }

    if (!plainContent) {
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

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    setEditError("");

    const title = editForm.title.trim();
    const content = editForm.content.trim();
    const plainContent = stripHtmlTags(content);

    if (!title) {
      setEditError("Judul wajib diisi.");
      return;
    }

    if (!plainContent) {
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
    return announcements.filter((announcement) => {
      if (dateFilter && getDateKey(announcement.created_at) !== dateFilter) {
        return false;
      }
      if (!query) return true;
      const title = normalizeText(announcement.title || "");
      const content = normalizeText(stripHtmlTags(announcement.content || ""));
      return title.includes(query) || content.includes(query);
    });
  }, [announcements, searchQuery, dateFilter]);

  const groupedAnnouncements = useMemo(() => {
    const sorted = [...filteredAnnouncements].sort((first, second) => {
      const firstDate = first.created_at
        ? new Date(first.created_at).getTime()
        : 0;
      const secondDate = second.created_at
        ? new Date(second.created_at).getTime()
        : 0;
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

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <AdminPageHeader
        title="Pengumuman"
        description="Kelola informasi terbaru untuk semua pengguna CSL."
        icon={<Megaphone className="h-5 w-5 text-sky-100" />}
        actions={
          <AnnouncementCreateDialog
            open={isDialogOpen}
            onOpenChange={handleDialogChange}
            titleValue={formData.title}
            contentValue={formData.content}
            onTitleChange={(value) =>
              setFormData((prev) => ({ ...prev, title: value }))
            }
            onContentChange={(value) =>
              setFormData((prev) => ({ ...prev, content: value }))
            }
            onSubmit={handleCreateAnnouncement}
            isSubmitting={isSubmitting}
            error={formError}
            trigger={
              <Button
                type="button"
                size="sm"
                className="bg-white text-slate-900 hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                Tambah Pengumuman
              </Button>
            }
          />
        }
      />

      <AnnouncementEditDialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => (!open ? handleEditClose() : null)}
        titleValue={editForm.title}
        contentValue={editForm.content}
        onTitleChange={(value) =>
          setEditForm((prev) => ({ ...prev, title: value }))
        }
        onContentChange={(value) =>
          setEditForm((prev) => ({ ...prev, content: value }))
        }
        onSubmit={handleEditSubmit}
        isSubmitting={isEditing}
        error={editError}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}
      >
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
              className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InventoryFilterCard
        open={filterOpen}
        onToggle={() => setFilterOpen((prev) => !prev)}
        onReset={() => {
          setSearchQuery("");
          setDateFilter("");
          setFilterOpen(false);
        }}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari judul atau isi pengumuman"
              className="h-6 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
          <DatePicker
            value={parseDateKey(dateFilter)}
            onChange={(value) => setDateFilter(value ? formatDateKey(value) : "")}
            clearable
            className="w-full"
            buttonClassName="h-11 rounded-lg border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
      </InventoryFilterCard>

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
                      const createdAt = announcement.created_at
                        ? new Date(announcement.created_at).getTime()
                        : null;
                      const updatedAt = announcement.updated_at
                        ? new Date(announcement.updated_at).getTime()
                        : null;
                      const updatedLabel =
                        updatedAt && (!createdAt || updatedAt !== createdAt)
                          ? formatDateTime(announcement.updated_at)
                          : "";
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
                                {/* <ImageIcon className="h-3 w-3" /> */}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-base font-semibold text-slate-900">
                                {announcement.title}
                              </p>
                              <div
                                className="text-sm text-slate-500 leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-5"
                                dangerouslySetInnerHTML={{ __html: content }}
                              />
                            </div>
                            <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                              <User2 className="h-3.5 w-3.5" />
                              <span className="max-w-[120px] truncate">
                                {creatorName}
                              </span>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                {timeLabel}
                              </span>
                              {updatedLabel ? (
                                <span className="text-[10px] text-slate-400">
                                  Diupdate {updatedLabel}
                                </span>
                              ) : null}
                            </div>
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
