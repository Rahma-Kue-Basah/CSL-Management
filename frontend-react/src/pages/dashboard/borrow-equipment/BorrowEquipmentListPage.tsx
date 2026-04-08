"use client";

import BorrowEquipmentListContent from "@/components/dashboard/borrow-equipment/content/BorrowEquipmentListContent";

export default function BorrowEquipmentListPage() {
  return (
    <BorrowEquipmentListContent
      scope="my"
      emptyMessage="Belum ada pengajuan peminjaman alat."
    />
  );
}
