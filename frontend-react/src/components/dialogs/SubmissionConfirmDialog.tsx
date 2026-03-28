"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import InlineErrorAlert from "@/components/shared/inline-error-alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmissionSummaryItemProps = {
  label: string;
  value: string;
};

export function SubmissionSummaryItem({
  label,
  value,
}: SubmissionSummaryItemProps) {
  const displayValue = value?.trim() ? value : "-";

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
          displayValue === "-"
            ? "italic text-slate-400"
            : "font-medium text-slate-800",
        )}
      >
        {displayValue}
      </p>
    </div>
  );
}

type SubmissionConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  children: ReactNode;
};

export function SubmissionConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  isSubmitting = false,
  errorMessage = "",
  onConfirm,
  children,
}: SubmissionConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="flex max-h-[85vh] max-w-xl flex-col border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">{children}</div>

        <div className="shrink-0 border-t border-slate-200 bg-white pt-4">
          {errorMessage ? (
            <div className="mb-4">
              <InlineErrorAlert>{errorMessage}</InlineErrorAlert>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSubmitting}
              className="rounded-md border-slate-300"
            >
              Batal
            </AlertDialogCancel>
            {!errorMessage ? (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={onConfirm}
                className="rounded-md bg-[#0052C7] text-white hover:bg-[#0048B4]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  "Konfirmasi"
                )}
              </Button>
            ) : null}
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
