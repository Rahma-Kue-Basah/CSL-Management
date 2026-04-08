"use client";

import BookingRoomsListContent from "@/components/dashboard/booking-rooms/content/BookingRoomsListContent";

export default function BookingRoomsListPage() {
  return (
    <BookingRoomsListContent
      scope="my"
      emptyMessage="Belum ada pengajuan peminjaman lab."
    />
  );
}
