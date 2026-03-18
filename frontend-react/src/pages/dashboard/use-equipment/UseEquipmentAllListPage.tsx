"use client";

import UseEquipmentListContent from "@/pages/dashboard/use-equipment/UseEquipmentListContent";

export default function UseEquipmentAllListPage() {
  return (
    <UseEquipmentListContent
      scope="all"
      emptyMessage="Belum ada pengajuan penggunaan alat yang tersedia."
    />
  );
}
