"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleHelp, Loader2, Plus, Search } from "lucide-react";

import { AdminDetailHeader } from "@/components/admin/AdminDetailHeader";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFilterCard } from "@/components/admin/admin-filter-card";
import FaqBulkActions from "@/components/admin/information/FaqBulkActions";
import FaqTable from "@/components/admin/information/FaqTable";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateFaq } from "@/hooks/faqs/use-create-faq";
import { useDeleteFaq } from "@/hooks/faqs/use-delete-faq";
import { useFaqs, type Faq } from "@/hooks/faqs/use-faqs";
import { useUpdateFaq } from "@/hooks/faqs/use-update-faq";
import { USER_MODAL_WIDTH_CLASS } from "@/components/admin/user-management/user-management-fields";
import { toast } from "sonner";

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

type FaqFormState = {
  question: string;
  answer: string;
};

const EMPTY_FORM: FaqFormState = {
  question: "",
  answer: "",
};
const PAGE_SIZE = 10;

type SortOrder = "newest" | "oldest";

function FaqDetailField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-700">{label}</p>
      <div
        className={`rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 ${
          multiline ? "min-h-36 whitespace-pre-wrap break-words" : ""
        }`}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function FaqFormDialog({
  open,
  onOpenChange,
  title,
  description,
  form,
  onChange,
  onSubmit,
  isSubmitting,
  error,
  trigger,
  useDetailHeader = false,
  readOnly = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  form: FaqFormState;
  onChange: (field: keyof FaqFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  error: string;
  trigger?: ReactNode;
  useDetailHeader?: boolean;
  readOnly?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        showCloseButton={!useDetailHeader}
        className={`${USER_MODAL_WIDTH_CLASS} gap-0 p-0 [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]`}
      >
        {useDetailHeader ? (
          <AdminDetailHeader
            title={title}
            description={description}
            icon={<CircleHelp className="h-5 w-5" />}
            backLabel="Tutup"
            onBack={() => onOpenChange(false)}
          />
        ) : (
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        )}

        <form
          className={`space-y-4 ${useDetailHeader ? "px-5 py-4 sm:px-6" : "px-6 pb-6"}`}
          onSubmit={onSubmit}
        >
          {readOnly ? (
            <>
              <FaqDetailField label="Pertanyaan" value={form.question} />
              <FaqDetailField label="Jawaban" value={form.answer} multiline />
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">
                  Pertanyaan
                </label>
                <Input
                  value={form.question}
                  onChange={(event) => onChange("question", event.target.value)}
                  placeholder="Masukkan pertanyaan yang sering diajukan"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">
                  Jawaban
                </label>
                <Textarea
                  value={form.answer}
                  onChange={(event) => onChange("answer", event.target.value)}
                  placeholder="Masukkan jawaban FAQ"
                  className="min-h-36 resize-y"
                />
              </div>
            </>
          )}

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {!readOnly ? (
            <DialogFooter>
              <Button
                type="submit"
                className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
  const [viewTarget, setViewTarget] = useState<Faq | null>(null);
  const [editTarget, setEditTarget] = useState<Faq | null>(null);
  const [editForm, setEditForm] = useState<FaqFormState>(EMPTY_FORM);
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
  const visiblePages = useMemo(() => {
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [page, totalPages]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => faqs.some((item) => item.id === id)),
    );
  }, [faqs]);

  const allVisibleSelected =
    faqs.length > 0 &&
    faqs.every((item) => selectedIds.includes(item.id));
  const someVisibleSelected =
    faqs.some((item) => selectedIds.includes(item.id)) &&
    !allVisibleSelected;
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

  const handleEditDialogChange = (open: boolean) => {
    if (!open) {
      setEditTarget(null);
      setEditForm(EMPTY_FORM);
      setUpdateError("");
    }
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

    return { question, answer };
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
    if (!editTarget) return;
    setUpdateError("");
    const payload = validateForm(editForm, setUpdateError);
    if (!payload) return;

    const result = await updateFaq(editTarget.id, payload);
    if (!result.ok || !result.data) return;

    setFaqs((prev) =>
      prev.map((item) =>
        item.id === result.data?.id ? (result.data as Faq) : item,
      ),
    );
    handleEditDialogChange(false);
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
        open={Boolean(viewTarget)}
        onOpenChange={(open) => (!open ? setViewTarget(null) : null)}
        title="Detail FAQ"
        description="Tinjau pertanyaan dan jawaban FAQ."
        form={{
          question: viewTarget?.question || "",
          answer: viewTarget?.answer || "",
        }}
        onChange={() => undefined}
        onSubmit={(event) => event.preventDefault()}
        isSubmitting={false}
        error=""
        useDetailHeader
        readOnly
      />

      <FaqFormDialog
        open={Boolean(editTarget)}
        onOpenChange={handleEditDialogChange}
        title="Edit FAQ"
        description="Perbarui pertanyaan dan jawaban FAQ."
        form={editForm}
        onChange={(field, value) =>
          setEditForm((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={handleEditSubmit}
        isSubmitting={isUpdating}
        error={updateError}
        useDetailHeader
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              FAQ yang dihapus tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus FAQ terpilih?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCount} FAQ yang dipilih akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={selectedCount === 0 || isDeleting}
              className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminFilterCard
        open={filterOpen}
        onToggle={() => setFilterOpen((prev) => !prev)}
        onReset={() => {
          setSearchQuery("");
          setDebouncedSearchQuery("");
          setSortOrder("newest");
          setPage(1);
          setFilterOpen(false);
        }}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                placeholder="Cari pertanyaan atau jawaban"
                className="h-6 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-800">
              Urutkan
            </label>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-200"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </div>
        </div>
      </AdminFilterCard>

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {deleteError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {deleteError}
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FaqBulkActions
            selectedCount={selectedCount}
            isDeleting={isDeleting}
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
          onView={(item) => setViewTarget(item)}
          onEdit={(item) => {
            setEditTarget(item);
            setEditForm({
              question: item.question || "",
              answer: item.answer || "",
            });
            setUpdateError("");
          }}
          onDelete={(item) => setDeleteTarget(item)}
        />

        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex w-fit max-w-full self-start flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(1)}
              aria-label="Halaman pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {visiblePages.map((pageNumber) => (
              <Button
                key={pageNumber}
                type="button"
                variant={pageNumber === page ? "default" : "ghost"}
                size="sm"
                className="min-w-8 px-2"
                disabled={isLoading}
                onClick={() => setPage(pageNumber)}
                aria-label={`Halaman ${pageNumber}`}
              >
                {pageNumber}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage(totalPages)}
              aria-label="Halaman terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
