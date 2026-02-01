"use client";

import EquipmentForm from "@/components/feature/equipment-form";

export default function EquipmentFormEditPage({ params }) {
  return <EquipmentForm equipmentId={params?.id} />;
}
