"use client";

import { BookingRoomsListContent } from "@/components/dashboard/booking-rooms/content";

export default function BookingRoomsAllListPage() {
  return (
    <BookingRoomsListContent
      scope="all"
      emptyMessage="Belum ada pengajuan peminjaman lab yang tersedia."
    />
  );
}
