"use client";

import { CheckCircle2, OctagonX, Loader2 } from "lucide-react";

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
} from "@/components/ui/alert-dialog";

type BookingStatusConfirmDialogProps = {
  open: boolean;
  actionType: "approve" | "reject" | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
};

export default function BookingStatusConfirmDialog({
  open,
  actionType,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: BookingStatusConfirmDialogProps) {
  const isApprove = actionType === "approve";

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
            {isApprove ? "Setujui pengajuan ini?" : "Tolak pengajuan ini?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isApprove
              ? "Pengajuan booking akan diproses sebagai pengajuan yang disetujui."
              : "Pengajuan booking akan diproses sebagai pengajuan yang ditolak."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isSubmitting}
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
