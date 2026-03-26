"use client";

import type { ReactNode } from "react";

import AdminRoomBookingRecordDetailContent from "@/components/admin/records/AdminRoomBookingRecordDetailContent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BookingRow } from "@/hooks/bookings/use-bookings";

type AdminRoomBookingRecordDetailDialogProps = {
  open: boolean;
  booking: BookingRow | null;
  isLoading: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onOpenRoomDetail?: (roomId: string | number) => void;
  onOpenUserDetail?: (userId: string | number) => void;
  actions?: ReactNode;
  backLabel?: string;
  showAside?: boolean;
};

export default function AdminRoomBookingRecordDetailDialog({
  open,
  booking,
  isLoading,
  error,
  onOpenChange,
  onOpenRoomDetail,
  onOpenUserDetail,
  actions,
  backLabel = "Tutup",
  showAside = false,
}: AdminRoomBookingRecordDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none sm:w-[50vw] sm:max-w-[960px] sm:min-w-[720px] sm:max-w-none"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Detail Booking Ruangan</DialogTitle>
          <DialogDescription>
            Detail booking ruangan ditampilkan dalam modal.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[85vh] overflow-y-auto px-1 pt-1 pb-4">
          <AdminRoomBookingRecordDetailContent
            booking={booking}
            isLoading={isLoading}
            error={error}
            showAside={showAside}
            backLabel={backLabel}
            onBack={() => onOpenChange(false)}
            onOpenRoomDetail={onOpenRoomDetail}
            onOpenUserDetail={onOpenUserDetail}
            actions={actions}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
