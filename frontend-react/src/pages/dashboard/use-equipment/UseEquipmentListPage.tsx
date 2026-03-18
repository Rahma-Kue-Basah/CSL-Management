"use client";

import UseEquipmentListContent from "@/pages/dashboard/use-equipment/UseEquipmentListContent";

export default function UseEquipmentListPage() {
  return (
    <UseEquipmentListContent
      scope="my"
      emptyMessage="Belum ada pengajuan penggunaan alat."
    />
  );
}
