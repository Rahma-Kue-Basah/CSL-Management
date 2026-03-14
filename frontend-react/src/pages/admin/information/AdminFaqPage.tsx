"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { CircleHelp, Pencil, Plus, Search, Trash2, User2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InventoryFilterCard } from "@/components/admin/inventory/inventory-filter-card";
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
import { useCreateFaq } from "@/hooks/faqs/use-create-faq";
import { useDeleteFaq } from "@/hooks/faqs/use-delete-faq";
import { useFaqs, type Faq } from "@/hooks/faqs/use-faqs";
import { useUpdateFaq } from "@/hooks/faqs/use-update-faq";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
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

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function summarizeText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

type FaqFormState = {
  question: string;
  answer: string;
};

const EMPTY_FORM: FaqFormState = {
  question: "",
  answer: "",
};

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
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
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

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="submit"
              className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminFaqPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const { faqs, setFaqs, isLoading, error, setError } = useFaqs();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FaqFormState>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<Faq | null>(null);
  const [editForm, setEditForm] = useState<FaqFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);
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
    isDeleting,
    errorMessage: deleteError,
    setErrorMessage: setDeleteError,
  } = useDeleteFaq();

  const filteredFaqs = useMemo(() => {
    const query = normalizeText(searchQuery);
    if (!query) return faqs;
    return faqs.filter((item) =>
      normalizeText(`${item.question} ${item.answer}`).includes(query),
    );
  }, [faqs, searchQuery]);

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

    setFaqs((prev) => [result.data as Faq, ...prev]);
    setIsCreateOpen(false);
    resetCreateDialog();
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
    setDeleteTarget(null);
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <AdminPageHeader
        title="FAQ / QnA"
        description="Kelola pertanyaan dan jawaban yang akan ditampilkan ke pengguna dashboard."
        icon={<CircleHelp className="h-5 w-5 text-sky-100" />}
        actions={
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
            trigger={
              <Button
                type="button"
                size="sm"
                className="bg-white text-slate-900 hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                Tambah FAQ
              </Button>
            }
          />
        }
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

      <InventoryFilterCard
        open={filterOpen}
        onToggle={() => setFilterOpen((prev) => !prev)}
        onReset={() => {
          setSearchQuery("");
          setFilterOpen(false);
        }}
      >
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari pertanyaan atau jawaban"
            className="h-6 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      </InventoryFilterCard>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {deleteError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {deleteError}
        </div>
      ) : null}

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`faq-admin-skeleton-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
            >
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-4 w-40" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : filteredFaqs.length ? (
          filteredFaqs.map((item) => {
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-slate-900">
                      {item.question}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {summarizeText(item.answer, 2000)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>{formatDateTime(item.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditTarget(item);
                          setEditForm({
                            question: item.question || "",
                            answer: item.answer || "",
                          });
                          setUpdateError("");
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            {faqs.length
              ? "Tidak ada FAQ yang cocok dengan pencarian."
              : "Belum ada FAQ. Tambahkan FAQ pertama untuk pengguna."}
          </div>
        )}
      </div>
    </section>
  );
}
