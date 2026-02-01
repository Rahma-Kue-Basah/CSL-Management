"use client";

import RoomForm from "@/components/feature/room-form";

export default function RoomFormEditPage({ params }) {
  return <RoomForm roomId={params?.id} />;
}
