"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Megaphone } from "lucide-react";

import AdminDetailDialogShell from "@/components/shared/admin-detail-dialog-shell";
import AdminDetailActions from "@/components/shared/admin-detail-actions";
import InlineErrorAlert from "@/components/shared/inline-error-alert";
import { USER_MODAL_WIDTH_CLASS } from "@/components/admin/user-management/user-management-fields";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { stripHtmlTags } from "@/lib/text";

const DIALOG_WIDTH_CLASS = `${USER_MODAL_WIDTH_CLASS} gap-0 p-0 [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]`;

export type AnnouncementDetailMode = "view" | "edit";

type CreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleValue: string;
  contentValue: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  error?: string;
};

export function AnnouncementCreateDialog({
  open,
  onOpenChange,
  titleValue,
  contentValue,
  onTitleChange,
  onContentChange,
  onSubmit,
  isSubmitting,
  error,
}: CreateDialogProps) {
  return (
    <AdminDetailDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah Pengumuman"
      description="Buat pengumuman baru untuk ditampilkan kepada pengguna."
      icon={<Megaphone className="h-5 w-5" />}
      contentClassName={DIALOG_WIDTH_CLASS}
    >
      <form className="space-y-4 px-5 py-4 sm:px-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Judul</label>
            <Input
              name="title"
              value={titleValue}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Contoh: Maintenance jaringan Jumat"
              className="border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Isi Pengumuman
            </label>
            <textarea
              name="content"
              value={contentValue}
              onChange={(event) => onContentChange(event.target.value)}
              placeholder="Tulis detail pengumuman yang akan ditampilkan."
              rows={8}
              className="w-full rounded-md border border-sky-300 bg-sky-50/60 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-200"
            />
          </div>
          {error ? (
            <InlineErrorAlert>{error}</InlineErrorAlert>
          ) : null}
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Pengumuman"}
            </Button>
          </DialogFooter>
      </form>
    </AdminDetailDialogShell>
  );
}

type EditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AnnouncementDetailMode;
  onCancelEdit?: () => void;
  onDeleteRequest?: () => void;
  titleValue: string;
  contentValue: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  error?: string;
};

export function AnnouncementEditDialog({
  open,
  onOpenChange,
  initialMode = "edit",
  onCancelEdit,
  onDeleteRequest,
  titleValue,
  contentValue,
  onTitleChange,
  onContentChange,
  onSubmit,
  isSubmitting,
  error,
}: EditDialogProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const openedInEditMode = initialMode === "edit";

  useEffect(() => {
    if (!open) return;
    setIsEditing(initialMode === "edit");
  }, [initialMode, open]);

  const readOnly = !isEditing;

  return (
    <AdminDetailDialogShell
      open={open}
      onOpenChange={onOpenChange}
      onCloseReset={() => setIsEditing(false)}
      title={readOnly ? "Detail Pengumuman" : "Edit Pengumuman"}
      description={
        readOnly
          ? "Tinjau judul dan isi pengumuman."
          : "Perbarui judul dan isi pengumuman yang akan tampil kepada pengguna."
      }
      icon={<Megaphone className="h-5 w-5" />}
      contentClassName={DIALOG_WIDTH_CLASS}
    >
      <form ref={formRef} className="space-y-4 px-6 pb-6" onSubmit={onSubmit}>
          {readOnly ? (
            <>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">Judul</p>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {titleValue || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">Isi Pengumuman</p>
                <div className="min-h-36 whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {stripHtmlTags(contentValue) || "-"}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Judul</label>
                <Input
                  name="title"
                  value={titleValue}
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder="Judul pengumuman"
                  className="border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Isi Pengumuman
                </label>
                <textarea
                  name="content"
                  value={contentValue}
                  onChange={(event) => onContentChange(event.target.value)}
                  placeholder="Tulis detail pengumuman"
                  rows={8}
                  className="w-full rounded-md border border-sky-300 bg-sky-50/60 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-200"
                />
              </div>
            </>
          )}
          {error ? (
            <InlineErrorAlert>{error}</InlineErrorAlert>
          ) : null}
          <AdminDetailActions
            isEditing={!readOnly}
            isSubmitting={isSubmitting}
            showDeleteAction={Boolean(onDeleteRequest)}
            deleteLabel="Hapus"
            saveLabel="Simpan Perubahan"
            onEdit={() => setIsEditing(true)}
            onCancelEdit={() => {
              setIsEditing(false);
              if (openedInEditMode) {
                onOpenChange(false);
                return;
              }
              if (onCancelEdit) {
                onCancelEdit();
                return;
              }
              onOpenChange(false);
            }}
            onSave={() => formRef.current?.requestSubmit()}
            onDelete={onDeleteRequest}
          />
      </form>
    </AdminDetailDialogShell>
  );
}
