"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DashboardDetailReviewPanel,
  type ReviewContext,
} from "@/components/dashboard/layout/DashboardDetailReviewPanel";

function getReviewDialogTitle(context: Exclude<ReviewContext, null>) {
  switch (context.kind) {
    case "booking":
      return "Review Pengajuan Peminjaman Lab";
    case "use":
      return "Review Pengajuan Penggunaan Alat";
    case "borrow":
      return "Review Pengajuan Peminjaman Alat";
  }
}

type DashboardDetailReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: ReviewContext;
  onActionComplete?: () => void;
};

export function DashboardDetailReviewDialog({
  open,
  onOpenChange,
  context,
  onActionComplete,
}: DashboardDetailReviewDialogProps) {
  if (!context) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-none bg-transparent p-0 shadow-none sm:max-w-2xl">
        <DialogTitle className="sr-only">{getReviewDialogTitle(context)}</DialogTitle>
        <DashboardDetailReviewPanel
          context={context}
          onActionComplete={onActionComplete}
        />
      </DialogContent>
    </Dialog>
  );
}
