"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import { ProgressSteps, type ProgressStepItem } from "./ProgressSteps";

type RequestProgressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  code: string;
  steps: ProgressStepItem[];
};

export function RequestProgressDialog({
  open,
  onOpenChange,
  title,
  code,
  steps,
}: RequestProgressDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:max-w-lg"
      >
        <DialogHeader className="text-left">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-slate-500">
            {code}
          </p>
          <ProgressSteps steps={steps} orientation="vertical" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
