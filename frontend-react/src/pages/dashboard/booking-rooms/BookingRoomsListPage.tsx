"use client";

import BookingRoomsListContent from "@/pages/dashboard/booking-rooms/BookingRoomsListContent";

export default function BookingRoomsListPage() {
  return (
    <BookingRoomsListContent
      scope="my"
      emptyMessage="Belum ada pengajuan peminjaman lab."
    />
  );
}
