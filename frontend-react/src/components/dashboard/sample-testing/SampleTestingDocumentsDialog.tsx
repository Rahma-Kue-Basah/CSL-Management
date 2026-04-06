"use client";

import { FileText, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SampleTestingDocumentsSection from "@/components/dashboard/sample-testing/SampleTestingDocumentsSection";
import { usePengujianDetail } from "@/hooks/pengujians/use-pengujians";

export default function SampleTestingDocumentsDialog({
  open,
  onOpenChange,
  pengujianId,
  viewerRole,
  onUploaded,
  allowActions = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pengujianId: string | null;
  viewerRole: "approver" | "requester";
  onUploaded?: () => void;
  allowActions?: boolean;
}) {
  const { pengujian, isLoading, error } = usePengujianDetail(pengujianId, {
    enabled: open && Boolean(pengujianId),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-200 p-0 shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:max-w-3xl">
        <DialogHeader className="border-b border-slate-200 px-6 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-sm font-semibold text-slate-900">
                Dokumen Pengujian
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-500">
                {pengujian?.code ?? "Memuat dokumen pengujian sampel."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat dokumen...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : pengujian ? (
            <SampleTestingDocumentsSection
              item={pengujian}
              viewerRole={viewerRole}
              onUploaded={onUploaded}
              embedded
              allowActions={allowActions}
            />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Data pengujian tidak ditemukan.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
