"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Loader2,
  Megaphone,
  Plus,
  Search,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFilterCard } from "@/components/admin/admin-filter-card";
import AnnouncementBulkActions from "@/components/admin/information/AnnouncementBulkActions";
import AnnouncementTable from "@/components/admin/information/AnnouncementTable";
import ConfirmDeleteDialog from "@/components/shared/confirm-delete-dialog";
import { DataPagination } from "@/components/shared/data-pagination";
import InlineErrorAlert from "@/components/shared/inline-error-alert";
import {
  AnnouncementCreateDialog,
  AnnouncementEditDialog,
  type AnnouncementDetailMode,
} from "@/components/admin/pengumuman/announcement-dialogs";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  useAnnouncements,
  type Announcement,
} from "@/hooks/announcements/use-announcements";
import { useCreateAnnouncement } from "@/hooks/announcements/use-create-announcement";
import { useUpdateAnnouncement } from "@/hooks/announcements/use-update-announcement";
import { useDeleteAnnouncement } from "@/hooks/announcements/use-delete-announcement";
import { formatDateKey, parseDateKey } from "@/lib/date";
import { stripHtmlTags } from "@/lib/text";
import { toast } from "sonner";

const PAGE_SIZE = 10;
type SortOrder = "newest" | "oldest";

export default function AdminAnnouncementPage() {
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const {
    announcements,
    setAnnouncements,
    totalCount,
    setTotalCount,
    isLoading,
    error: errorMessage,
    setError: setErrorMessage,
  } = useAnnouncements(
    page,
    PAGE_SIZE,
    {
      search: debouncedSearchQuery,
      ordering: sortOrder === "oldest" ? "created_at" : "-created_at",
      date: dateFilter || undefined,
    },
    reloadKey,
  );
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
  const [detailTarget, setDetailTarget] = useState<Announcement | null>(null);
  const [detailMode, setDetailMode] = useState<AnnouncementDetailMode>("view");
  const [detailForm, setDetailForm] = useState({ title: "", content: "" });
  const {
    updateAnnouncement,
    isSubmitting: isEditing,
    errorMessage: editError,
    setErrorMessage: setEditError,
  } = useUpdateAnnouncement();
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const {
    deleteAnnouncement,
    bulkDeleteAnnouncements,
    isDeleting,
  } = useDeleteAnnouncement();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const isSearchDebouncing = searchQuery.trim() !== debouncedSearchQuery;

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => announcements.some((item) => item.id === id)),
    );
  }, [announcements]);

  const allVisibleSelected =
    announcements.length > 0 &&
    announcements.every((item) => selectedIds.includes(item.id));
  const someVisibleSelected =
    announcements.some((item) => selectedIds.includes(item.id)) &&
    !allVisibleSelected;
  const selectedCount = selectedIds.length;

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setFormError("");
      setFormData({ title: "", content: "" });
    }
  };

  const handleDetailOpen = (
    announcement: Announcement,
    mode: AnnouncementDetailMode,
  ) => {
    setDetailTarget(announcement);
    setDetailMode(mode);
    setDetailForm({
      title: announcement.title || "",
      content: announcement.content || "",
    });
    setEditError("");
  };

  const handleDetailClose = () => {
    setDetailTarget(null);
    setDetailMode("view");
    setDetailForm({ title: "", content: "" });
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
      const result = await createAnnouncement({ title, content });

      if (!result.ok) return;

      setFormData({ title: "", content: "" });
      setIsDialogOpen(false);
      setPage(1);
      setReloadKey((prev) => prev + 1);
      toast.success("Pengumuman berhasil ditambahkan.");
    } finally {
      // handled in hook
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detailTarget) return;
    setEditError("");

    const title = detailForm.title.trim();
    const content = detailForm.content.trim();
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
      const result = await updateAnnouncement(detailTarget.id, { title, content });

      if (!result.ok) return;

      if (result.data) {
        setAnnouncements((prev) =>
          prev.map((item) =>
            item.id === result.data?.id ? (result.data as Announcement) : item,
          ),
        );
      }

      handleDetailClose();
      toast.success("Pengumuman berhasil diperbarui.");
    } finally {
      // handled in hook
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteAnnouncement(deleteTarget.id);

      if (!result.ok) {
        setErrorMessage(result.message || "Gagal menghapus pengumuman.");
        return;
      }

      setAnnouncements((prev) =>
        prev.filter((item) => item.id !== deleteTarget.id),
      );
      setTotalCount((prev) => Math.max(0, prev - 1));
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);

      if (announcements.length === 1 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        setReloadKey((prev) => prev + 1);
      }

      toast.success("Pengumuman berhasil dihapus.");
    } finally {
      // handled in hook
    }
  };

  const handleToggleItemSelection = (announcement: Announcement) => {
    setSelectedIds((current) =>
      current.includes(announcement.id)
        ? current.filter((id) => id !== announcement.id)
        : [...current, announcement.id],
    );
  };

  const handleToggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedIds((current) => {
        const next = new Set(current);
        announcements.forEach((item) => next.add(item.id));
        return Array.from(next);
      });
      return;
    }

    setSelectedIds((current) =>
      current.filter((id) => !announcements.some((item) => item.id === id)),
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    const idsToDelete = [...selectedIds];
    const result = await bulkDeleteAnnouncements(idsToDelete);

    if (!result.ok) {
      setErrorMessage(result.message || "Gagal menghapus pengumuman terpilih.");
      return;
    }

    const failedIds = (result.failedIds ?? []).map((id) => String(id));
    const deletedIds = (result.deletedIds ?? []).map((id) => String(id));

    if (failedIds.length) {
      setErrorMessage(result.message || "Sebagian pengumuman gagal dihapus.");
      setSelectedIds(failedIds);
      setAnnouncements((prev) =>
        prev.filter(
          (item) =>
            failedIds.includes(String(item.id)) ||
            !deletedIds.includes(String(item.id)),
        ),
      );
      setTotalCount((prev) => Math.max(0, prev - deletedIds.length));
      setBulkDeleteOpen(false);
      return;
    }

    setAnnouncements((prev) =>
      prev.filter((item) => !deletedIds.includes(String(item.id))),
    );
    setTotalCount((prev) => Math.max(0, prev - deletedIds.length));
    setSelectedIds([]);
    setBulkDeleteOpen(false);

    if (announcements.length === deletedIds.length && page > 1) {
      setPage((prev) => Math.max(1, prev - 1));
    } else {
      setReloadKey((prev) => prev + 1);
    }

    toast.success(result.message || "Pengumuman terpilih berhasil dihapus.");
  };

  useEffect(() => {
    setPage(1);
  }, [dateFilter, debouncedSearchQuery, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <AdminPageHeader
        title="Pengumuman"
        description="Kelola informasi terbaru untuk semua pengguna CSL."
        icon={<Megaphone className="h-5 w-5 text-sky-100" />}
      />

      <AnnouncementEditDialog
        open={Boolean(detailTarget)}
        onOpenChange={(open) => (!open ? handleDetailClose() : null)}
        initialMode={detailMode}
        onCancelEdit={() => {
          if (!detailTarget) return;
          setDetailForm({
            title: detailTarget.title || "",
            content: detailTarget.content || "",
          });
          setEditError("");
        }}
        onDeleteRequest={() => {
          if (!detailTarget) return;
          setDeleteTarget(detailTarget);
        }}
        titleValue={detailForm.title}
        contentValue={detailForm.content}
        onTitleChange={(value) =>
          setDetailForm((prev) => ({ ...prev, title: value }))
        }
        onContentChange={(value) =>
          setDetailForm((prev) => ({ ...prev, content: value }))
        }
        onSubmit={handleEditSubmit}
        isSubmitting={isEditing}
        error={editError}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}
        title="Hapus pengumuman?"
        description="Pengumuman yang dihapus tidak bisa dikembalikan."
        isDeleting={isDeleting}
        onConfirm={handleDeleteAnnouncement}
      />

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Hapus pengumuman terpilih?"
        description={`${selectedCount} pengumuman yang dipilih akan dihapus permanen.`}
        isDeleting={selectedCount === 0 || isDeleting}
        onConfirm={handleDeleteSelected}
      />

      <AdminFilterCard
        open={filterOpen}
        onToggle={() => setFilterOpen((prev) => !prev)}
        onReset={() => {
          setSearchQuery("");
          setDebouncedSearchQuery("");
          setDateFilter("");
          setSortOrder("newest");
          setPage(1);
        }}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-800">
              Pencarian
            </label>
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5">
              {isSearchDebouncing ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : (
                <Search className="h-4 w-4 text-slate-400" />
              )}
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari judul atau isi pengumuman"
                className="h-6 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-800">
              Tanggal
            </label>
            <DatePicker
              value={parseDateKey(dateFilter)}
              onChange={(value) => setDateFilter(value ? formatDateKey(value) : "")}
              clearable
              className="w-full"
              buttonClassName="h-11 rounded-lg border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-800">
              Urutkan
            </label>
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as SortOrder)
              }
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-200"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </div>
        </div>
      </AdminFilterCard>

      {errorMessage ? (
        <InlineErrorAlert>{errorMessage}</InlineErrorAlert>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <AnnouncementBulkActions
            selectedCount={selectedCount}
            isDeleting={isDeleting}
            onClearSelection={() => setSelectedIds([])}
            onDeleteSelected={() => setBulkDeleteOpen(true)}
          />
          <Button
            type="button"
            size="sm"
            className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Tambah Pengumuman
          </Button>
        </div>

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
        />

        <AnnouncementTable
          announcements={announcements}
          isLoading={isLoading}
          emptyMessage={
            totalCount
              ? "Tidak ada pengumuman yang cocok dengan filter."
              : "Belum ada data pengumuman."
          }
          selectedIds={selectedIds}
          allVisibleSelected={allVisibleSelected}
          selectAllRef={selectAllRef}
          onToggleSelectAllVisible={handleToggleSelectAllVisible}
          onToggleItemSelection={handleToggleItemSelection}
          onView={(announcement) => handleDetailOpen(announcement, "view")}
          onEdit={(announcement) => handleDetailOpen(announcement, "edit")}
          onDelete={(announcement) => setDeleteTarget(announcement)}
        />

        <DataPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          itemLabel="pengumuman"
          isLoading={isLoading}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
}
