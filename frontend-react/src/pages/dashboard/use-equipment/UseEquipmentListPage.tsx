"use client";

import { UseEquipmentListContent } from "@/components/dashboard/use-equipment/content";

export default function UseEquipmentListPage() {
  return (
    <UseEquipmentListContent
      scope="my"
      emptyMessage="Belum ada pengajuan penggunaan alat."
    />
  );
}
