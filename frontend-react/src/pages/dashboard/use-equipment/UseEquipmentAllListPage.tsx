"use client";

import { UseEquipmentListContent } from "@/components/dashboard/use-equipment/content";

export default function UseEquipmentAllListPage() {
  return (
    <UseEquipmentListContent
      scope="all"
      emptyMessage="Belum ada pengajuan penggunaan alat yang tersedia."
    />
  );
}
