"use client";

import BookingRoomsListContent from "@/pages/dashboard/booking-rooms/BookingRoomsListContent";

export default function BookingRoomsAllListPage() {
  return (
    <BookingRoomsListContent
      scope="all"
      emptyMessage="Belum ada pengajuan booking ruangan yang tersedia."
    />
  );
}
