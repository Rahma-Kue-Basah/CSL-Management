"use client";

import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui";

type ConfirmDeleteDialogProps = {
  open?: boolean;
  title?: string;
  description?: string;
  isDeleting?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void;
  trigger?: ReactNode;
  size?: "default" | "sm";
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export default function ConfirmDeleteDialog({
  open,
  title = "Hapus item ini?",
  description = "Data yang dihapus tidak bisa dikembalikan.",
  isDeleting = false,
  onOpenChange,
  onConfirm,
  trigger,
  size = "default",
  contentClassName,
  headerClassName,
  footerClassName,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent size={size} className={contentClassName}>
        <AlertDialogHeader className={headerClassName}>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={footerClassName}>
          <AlertDialogCancel disabled={isDeleting}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            variant="destructive"
          >
            {isDeleting ? "Menghapus..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
