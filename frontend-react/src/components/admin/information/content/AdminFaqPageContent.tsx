"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  CircleHelp,
  Loader2,
  Plus,
  Search,
} from "lucide-react";

import {
  AdminPageHeader,
  AdminFilterCard,
  AdminFilterField,
  AdminFilterGrid,
  ADMIN_FILTER_SELECT_CLASS,
} from "@/components/admin/shared";

import {
  FaqBulkActions,
  FaqFormDialog,
  type FaqDetailMode,
  type FaqFormState,
  FaqTable,
} from "@/components/admin/information";

import { ConfirmDeleteDialog, DataPagination, InlineErrorAlert } from "@/components/shared";

import { Button, Input } from "@/components/ui";

import { useCreateFaq } from "@/hooks/information/faq";

import { useDeleteFaq } from "@/hooks/information/faq";

import { useFaqs, type Faq } from "@/hooks/information/faq";

import { useUpdateFaq } from "@/hooks/information/faq";

import { toast } from "sonner";

const EMPTY_FORM: FaqFormState = {
  question: "",
  answer: "",
  imageId: null,
  imageUrl: "",
  imageFile: null,
  removeImage: false,
};
const PAGE_SIZE = 10;

type SortOrder = "newest" | "oldest";

export default function AdminFaqPage() {
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const {
    faqs,
    setFaqs,
    totalCount,
    setTotalCount,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  } = useFaqs(
    page,
    PAGE_SIZE,
    {
      search: debouncedSearchQuery,
      ordering: sortOrder === "oldest" ? "created_at" : "-created_at",
    },
    reloadKey,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FaqFormState>(EMPTY_FORM);
  const [detailTarget, setDetailTarget] = useState<Faq | null>(null);
  const [detailMode, setDetailMode] = useState<FaqDetailMode>("view");
  const [detailForm, setDetailForm] = useState<FaqFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const {
    createFaq,
    isSubmitting: isCreating,
    errorMessage: createError,
    setErrorMessage: setCreateError,
  } = useCreateFaq();
  const {
    updateFaq,
    isSubmitting: isUpdating,
    errorMessage: updateError,
    setErrorMessage: setUpdateError,
  } = useUpdateFaq();
  const {
    deleteFaq,
    bulkDeleteFaqs,
    isDeleting,
    errorMessage: deleteError,
    setErrorMessage: setDeleteError,
  } = useDeleteFaq();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const isSearchDebouncing = searchQuery.trim() !== debouncedSearchQuery;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => faqs.some((item) => item.id === id)),
    );
  }, [faqs]);

  const allVisibleSelected =
    faqs.length > 0 && faqs.every((item) => selectedIds.includes(item.id));
  const someVisibleSelected =
    faqs.some((item) => selectedIds.includes(item.id)) && !allVisibleSelected;
  const selectedCount = selectedIds.length;

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  const resetCreateDialog = () => {
    setCreateForm(EMPTY_FORM);
    setCreateError("");
  };

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) resetCreateDialog();
  };

  const handleDetailDialogChange = (open: boolean) => {
    if (!open) {
      setDetailTarget(null);
      setDetailMode("view");
      setDetailForm(EMPTY_FORM);
      setUpdateError("");
    }
  };

  const handleDetailOpen = (item: Faq, mode: FaqDetailMode) => {
    setDetailTarget(item);
    setDetailMode(mode);
    setDetailForm({
      question: item.question || "",
      answer: item.answer || "",
      imageId: item.image ?? null,
      imageUrl: item.imageUrl || "",
      imageFile: null,
      removeImage: false,
    });
    setUpdateError("");
  };

  const validateForm = (
    form: FaqFormState,
    setFormError: (value: string) => void,
  ) => {
    const question = form.question.trim();
    const answer = form.answer.trim();

    if (!question) {
      setFormError("Pertanyaan wajib diisi.");
      return null;
    }

    if (!answer) {
      setFormError("Jawaban wajib diisi.");
      return null;
    }

    return {
      question,
      answer,
      imageId: form.imageId ?? null,
      imageFile: form.imageFile ?? null,
      removeImage: form.removeImage ?? false,
    };
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError("");
    const payload = validateForm(createForm, setCreateError);
    if (!payload) return;

    const result = await createFaq(payload);
    if (!result.ok || !result.data) return;

    setIsCreateOpen(false);
    resetCreateDialog();
    setPage(1);
    setReloadKey((prev) => prev + 1);
    toast.success("FAQ berhasil ditambahkan.");
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detailTarget) return;
    setUpdateError("");
    const payload = validateForm(detailForm, setUpdateError);
    if (!payload) return;

    const result = await updateFaq(detailTarget.id, payload);
    if (!result.ok || !result.data) return;

    setFaqs((prev) =>
      prev.map((item) =>
        item.id === result.data?.id ? (result.data as Faq) : item,
      ),
    );
    handleDetailDialogChange(false);
    toast.success("FAQ berhasil diperbarui.");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    const result = await deleteFaq(deleteTarget.id);
    if (!result.ok) {
      setError(result.message || "Gagal menghapus FAQ.");
      return;
    }
    setFaqs((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    setTotalCount((prev) => Math.max(0, prev - 1));
    setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("FAQ berhasil dihapus.");
  };

  const handleToggleItemSelection = (faq: Faq) => {
    setSelectedIds((current) =>
      current.includes(faq.id)
        ? current.filter((id) => id !== faq.id)
        : [...current, faq.id],
    );
  };

  const handleToggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedIds((current) => {
        const next = new Set(current);
        faqs.forEach((item) => next.add(item.id));
        return Array.from(next);
      });
      return;
    }

    setSelectedIds((current) =>
      current.filter((id) => !faqs.some((item) => item.id === id)),
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    setDeleteError("");
    const idsToDelete = [...selectedIds];
    const result = await bulkDeleteFaqs(idsToDelete);

    if (!result.ok) {
      setError(result.message || "Gagal menghapus FAQ terpilih.");
      return;
    }

    const failedIds = (result.failedIds ?? []).map((id) => String(id));
    const deletedIds = (result.deletedIds ?? []).map((id) => String(id));

    if (failedIds.length) {
      setError(result.message || "Sebagian FAQ gagal dihapus.");
      setSelectedIds(failedIds);
      setFaqs((prev) =>
        prev.filter(
          (item) =>
            failedIds.includes(String(item.id)) ||
            !deletedIds.includes(String(item.id)),
        ),
      );
      setBulkDeleteOpen(false);
      return;
    }

    setFaqs((prev) =>
      prev.filter((item) => !deletedIds.includes(String(item.id))),
    );
    setTotalCount((prev) => Math.max(0, prev - deletedIds.length));
    setSelectedIds([]);
    setBulkDeleteOpen(false);
    toast.success(result.message || "FAQ terpilih berhasil dihapus.");
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <AdminPageHeader
        title="FAQ / QnA"
        description="Kelola pertanyaan dan jawaban yang akan ditampilkan ke pengguna dashboard."
        icon={<CircleHelp className="h-5 w-5 text-sky-100" />}
      />

      <FaqFormDialog
        open={Boolean(detailTarget)}
        onOpenChange={handleDetailDialogChange}
        title="Edit FAQ"
        description="Perbarui pertanyaan dan jawaban FAQ."
        readOnlyTitle="Detail FAQ"
        readOnlyDescription="Tinjau pertanyaan dan jawaban FAQ."
        initialMode={detailMode}
        onCancelEdit={() => {
          if (!detailTarget) return;
          setDetailForm({
            question: detailTarget.question || "",
            answer: detailTarget.answer || "",
            imageId: detailTarget.image ?? null,
            imageUrl: detailTarget.imageUrl || "",
            imageFile: null,
            removeImage: false,
          });
          setUpdateError("");
        }}
        onDeleteRequest={() => {
          if (!detailTarget) return;
          setDeleteTarget(detailTarget);
        }}
        form={detailForm}
        onChange={(field, value) =>
          setDetailForm((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={handleEditSubmit}
        isSubmitting={isUpdating}
        error={updateError}
        useDetailHeader
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}
        title="Hapus FAQ?"
        description="FAQ yang dihapus tidak bisa dikembalikan."
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Hapus FAQ terpilih?"
        description={`${selectedCount} FAQ yang dipilih akan dihapus permanen.`}
        isDeleting={selectedCount === 0 || isDeleting}
        onConfirm={handleDeleteSelected}
      />

      <AdminFilterCard
        open={filterOpen}
        onToggle={() => setFilterOpen((prev) => !prev)}
        onReset={() => {
          setSearchQuery("");
          setDebouncedSearchQuery("");
          setSortOrder("newest");
          setPage(1);
        }}
      >
        <AdminFilterGrid columns={2}>
          <AdminFilterField label="Pencarian">
            <div className="flex min-w-0 items-center gap-2 rounded-md border border-slate-400 bg-white px-2 py-1">
              {isSearchDebouncing ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : (
                <Search className="h-4 w-4 text-slate-400" />
              )}
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari pertanyaan atau jawaban"
                className="h-6 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
              />
            </div>
          </AdminFilterField>
          <AdminFilterField label="Urutkan">
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as SortOrder)
              }
              className={ADMIN_FILTER_SELECT_CLASS}
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </AdminFilterField>
        </AdminFilterGrid>
      </AdminFilterCard>

      {error ? (
        <InlineErrorAlert>{error}</InlineErrorAlert>
      ) : null}

      {deleteError ? (
        <InlineErrorAlert>{deleteError}</InlineErrorAlert>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FaqBulkActions
            selectedCount={selectedCount}
            isDeleting={isDeleting}
            onClearSelection={() => setSelectedIds([])}
            onDeleteSelected={() => setBulkDeleteOpen(true)}
          />
          <FaqFormDialog
            open={isCreateOpen}
            onOpenChange={handleCreateDialogChange}
            title="Tambah FAQ"
            description="Buat pertanyaan dan jawaban baru untuk halaman FAQ pengguna."
            form={createForm}
            onChange={(field, value) =>
              setCreateForm((prev) => ({ ...prev, [field]: value }))
            }
            onSubmit={handleCreateSubmit}
            isSubmitting={isCreating}
            error={createError}
            useDetailHeader
            trigger={
              <Button
                type="button"
                size="sm"
                className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
              >
                <Plus className="h-4 w-4" />
                Tambah FAQ
              </Button>
            }
          />
        </div>

        <FaqTable
          faqs={faqs}
          isLoading={isLoading}
          emptyMessage={
            totalCount
              ? "Tidak ada FAQ yang cocok dengan pencarian."
              : "Belum ada data FAQ."
          }
          selectedIds={selectedIds}
          allVisibleSelected={allVisibleSelected}
          selectAllRef={selectAllRef}
          onToggleSelectAllVisible={handleToggleSelectAllVisible}
          onToggleItemSelection={handleToggleItemSelection}
          onView={(item) => handleDetailOpen(item, "view")}
          onEdit={(item) => handleDetailOpen(item, "edit")}
          onDelete={(item) => setDeleteTarget(item)}
        />

        <DataPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          itemLabel="FAQ"
          isLoading={isLoading}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
}
