"use client";

import BookingForm from "@/components/feature/booking-form";

export default function BookingFormEditPage({ params }) {
  return <BookingForm bookingId={params?.id} />;
}
