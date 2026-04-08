"use client";

import { AdminEquipmentDetailDialog } from "@/components/admin/inventory";
import { useEquipmentDetail } from "@/hooks/shared/resources/equipments";

type RelatedEquipmentDetailDialogProps = {
  equipmentId: string | number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
};

export default function RelatedEquipmentDetailDialog({
  equipmentId,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: RelatedEquipmentDetailDialogProps) {
  const { equipment, isLoading, error } = useEquipmentDetail(open ? equipmentId : null);

  return (
    <AdminEquipmentDetailDialog
      open={open}
      equipment={equipment}
      isLoading={isLoading}
      error={error}
      canManage={false}
      onOpenChange={onOpenChange}
      onUpdated={onUpdated ?? (() => undefined)}
      onDeleted={onDeleted ?? (() => undefined)}
    />
  );
}
