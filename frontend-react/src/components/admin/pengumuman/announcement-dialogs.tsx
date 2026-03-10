"use client";

import type { FormEvent, ReactNode } from "react";

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

const DIALOG_WIDTH_CLASS =
  "w-[min(1000px,calc(100%-2rem))] max-w-none sm:max-w-none [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]";

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
  trigger: ReactNode;
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
  trigger,
}: CreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={DIALOG_WIDTH_CLASS}>
        <DialogHeader>
          <DialogTitle>Buat Pengumuman Baru</DialogTitle>
          {/* <DialogDescription>
            Pastikan judul singkat dan isi pengumuman jelas.
          </DialogDescription> */}
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Judul</label>
            <Input
              name="title"
              value={titleValue}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Contoh: Maintenance jaringan Jumat"
              className="focus-visible:border-[#0052C7] focus-visible:ring-[#0052C7]/20 aria-invalid:border-[#0052C7] aria-invalid:ring-[#0052C7]/20"
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
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:border-[#0052C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052C7]/20"
            />
          </div>
          {error ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              {error}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Pengumuman"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditDialogProps = {
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

export function AnnouncementEditDialog({
  open,
  onOpenChange,
  titleValue,
  contentValue,
  onTitleChange,
  onContentChange,
  onSubmit,
  isSubmitting,
  error,
}: EditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_WIDTH_CLASS}>
        <DialogHeader>
          <DialogTitle>Edit Pengumuman</DialogTitle>
          <DialogDescription>
            Perbarui judul dan isi pengumuman yang akan tampil di halaman publik.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Judul</label>
            <Input
              name="title"
              value={titleValue}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Judul pengumuman"
              className="focus-visible:border-[#0052C7] focus-visible:ring-[#0052C7]/20 aria-invalid:border-[#0052C7] aria-invalid:ring-[#0052C7]/20"
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
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:border-[#0052C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052C7]/20"
            />
          </div>
          {error ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              {error}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
