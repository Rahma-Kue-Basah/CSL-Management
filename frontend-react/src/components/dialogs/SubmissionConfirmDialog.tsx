"use client";

import type { ReactNode } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";

import InlineErrorAlert from "@/components/shared/InlineErrorAlert";
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
import { cn } from "@/lib/core/utils";

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
    <div className="rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm leading-6",
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
      <AlertDialogContent className="flex max-h-[85vh] max-w-xl flex-col border-slate-200 p-0 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <AlertDialogHeader className="place-items-start gap-0 border-b border-slate-200 px-6 py-5 text-left">
          <div className="flex w-full items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <ClipboardCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="text-sm font-semibold text-slate-900">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-sm text-slate-500">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">{children}</div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
          {errorMessage ? (
            <div className="mb-4">
              <InlineErrorAlert>{errorMessage}</InlineErrorAlert>
            </div>
          ) : null}

          <AlertDialogFooter className="gap-2 sm:justify-end">
            <AlertDialogCancel
              disabled={isSubmitting}
              className="rounded-md border-slate-300 text-sm"
            >
              Batal
            </AlertDialogCancel>
            {!errorMessage ? (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={onConfirm}
                className="rounded-md bg-[#0052C7] text-sm text-white hover:bg-[#0048B4]"
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
