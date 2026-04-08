"use client";

import { BorrowEquipmentListContent } from "@/components/dashboard/borrow-equipment/content";

export default function BorrowEquipmentAllListPage() {
  return (
    <BorrowEquipmentListContent
      scope="all"
      emptyMessage="Belum ada pengajuan peminjaman alat yang tersedia."
    />
  );
}
