"use client";


import { useEffect, useState } from "react";

import { CheckCircle2, Loader2, OctagonX } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Textarea,
} from "@/components/ui";

type StatusConfirmDialogProps = {
  open: boolean;
  actionType: "approve" | "reject" | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note?: string) => void;
  isSubmitting?: boolean;
  subjectLabel?: string;
  requireReasonOnReject?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
};

export default function StatusConfirmDialog({
  open,
  actionType,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
  subjectLabel = "pengajuan ini",
  requireReasonOnReject = false,
  reasonLabel = "Alasan penolakan",
  reasonPlaceholder = "Tuliskan alasan penolakan...",
}: StatusConfirmDialogProps) {
  const [resolvedActionType, setResolvedActionType] = useState<
    "approve" | "reject" | null
  >(actionType);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (actionType) {
      setResolvedActionType(actionType);
    }
  }, [actionType]);

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  const isApprove = resolvedActionType === "approve";
  const shouldCollectReason = !isApprove && requireReasonOnReject;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-lg border-slate-200 shadow-[0_18px_48px_rgba(15,23,42,0.16)]">
        <AlertDialogHeader>
          <AlertDialogMedia
            className={
              isApprove
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }
          >
            {isApprove ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <OctagonX className="h-8 w-8" />
            )}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isApprove
              ? `Setujui ${subjectLabel}?`
              : `Tolak ${subjectLabel}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isApprove
              ? `${subjectLabel} akan diproses sebagai data yang disetujui.`
              : `${subjectLabel} akan diproses sebagai data yang ditolak.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {shouldCollectReason ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">{reasonLabel}</p>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder={reasonPlaceholder}
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(shouldCollectReason ? reason : undefined)}
            disabled={isSubmitting || (shouldCollectReason && !reason.trim())}
            className={
              isApprove
                ? "rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                : "rounded-md bg-rose-600 text-white hover:bg-rose-700"
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : isApprove ? (
              "Ya, Setujui"
            ) : (
              "Ya, Tolak"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
