"use client";

import { AdminRoomDetailDialog } from "@/components/admin/inventory";
import { useRoomDetail } from "@/hooks/shared/resources/rooms";

type RelatedRoomDetailDialogProps = {
  roomId: string | number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
};

export default function RelatedRoomDetailDialog({
  roomId,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: RelatedRoomDetailDialogProps) {
  const { room, isLoading, error } = useRoomDetail(open ? roomId : null);

  return (
    <AdminRoomDetailDialog
      open={open}
      room={room}
      isLoading={isLoading}
      error={error}
      canManage={false}
      onOpenChange={onOpenChange}
      onUpdated={onUpdated ?? (() => undefined)}
      onDeleted={onDeleted ?? (() => undefined)}
    />
  );
}
