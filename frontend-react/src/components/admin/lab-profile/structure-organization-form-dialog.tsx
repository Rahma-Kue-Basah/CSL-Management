"use client";

import type { ChangeEvent, FormEvent } from "react";
import { GitBranch } from "lucide-react";

import AdminDetailDialogShell from "@/components/shared/admin-detail-dialog-shell";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type StructureOrganizationFormData = {
  title: string;
  name: string;
  parent: string;
};

export type StructureOrganizationParentOption = {
  id: string | number;
  title: string;
  name: string;
};

export type StructureOrganizationEditTarget = {
  id: string | number;
  title: string;
  name: string;
} | null;

type StructureOrganizationFormDialogProps = {
  open: boolean;
  editTarget: StructureOrganizationEditTarget;
  formData: StructureOrganizationFormData;
  parentOptions: StructureOrganizationParentOption[];
  submitMessage: string;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onInputChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

export default function StructureOrganizationFormDialog({
  open,
  editTarget,
  formData,
  parentOptions,
  submitMessage,
  isSubmitting,
  onOpenChange,
  onCloseReset,
  onSubmit,
  onInputChange,
}: StructureOrganizationFormDialogProps) {
  return (
    <AdminDetailDialogShell
      open={open}
      onOpenChange={onOpenChange}
      onCloseReset={onCloseReset}
      title={editTarget ? "Edit Struktur" : "Tambah Struktur"}
      description={
        editTarget
          ? `Perbarui data ${editTarget.title} - ${editTarget.name}.`
          : "Tambahkan posisi baru ke bagan struktur organisasi laboratorium."
      }
      icon={<GitBranch className="h-5 w-5" />}
      contentClassName="w-[min(640px,calc(100%-2rem))] max-w-none gap-0 p-0 sm:max-w-none [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]"
    >
      <form className="space-y-4 px-5 py-4 sm:px-6" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-xs font-medium text-slate-600">
            Jabatan
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={onInputChange}
            placeholder="Contoh: Kepala Laboratorium"
            className="border-slate-300 bg-white focus-visible:border-slate-500 focus-visible:ring-slate-200"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-medium text-slate-600">
            Nama Personel
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            placeholder="Masukkan nama pengisi posisi"
            className="border-slate-300 bg-white focus-visible:border-slate-500 focus-visible:ring-slate-200"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="parent" className="text-xs font-medium text-slate-600">
            Atasan Langsung
          </label>
          <select
            id="parent"
            name="parent"
            value={formData.parent}
            onChange={onInputChange}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none shadow-xs focus-visible:border-slate-500 focus-visible:ring-[3px] focus-visible:ring-slate-200"
          >
            <option value="">Tidak ada parent / posisi paling atas</option>
            {parentOptions.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.title} - {item.name}
              </option>
            ))}
          </select>
        </div>

        {submitMessage ? (
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              submitMessage.includes("berhasil")
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {submitMessage}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Menyimpan..."
              : editTarget
                ? "Simpan Perubahan"
                : "Tambah Struktur"}
          </Button>
        </DialogFooter>
      </form>
    </AdminDetailDialogShell>
  );
}
