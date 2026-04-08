"use client";

import { BorrowEquipmentListContent } from "@/components/dashboard/borrow-equipment/content";

export default function BorrowEquipmentListPage() {
  return (
    <BorrowEquipmentListContent
      scope="my"
      emptyMessage="Belum ada pengajuan peminjaman alat."
    />
  );
}
