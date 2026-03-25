"use client";

import BorrowEquipmentListContent from "@/pages/dashboard/borrow-equipment/BorrowEquipmentListContent";

export default function BorrowEquipmentAllListPage() {
  return (
    <BorrowEquipmentListContent
      scope="all"
      emptyMessage="Belum ada pengajuan peminjaman alat yang tersedia."
    />
  );
}
