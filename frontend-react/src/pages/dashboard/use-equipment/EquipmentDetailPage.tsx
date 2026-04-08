"use client";

import { ArrowLeft, ClipboardPlus, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useEquipmentDetail } from "@/hooks/shared/resources/equipments/use-equipments";

type EquipmentDetailParams = {
  id?: string | string[];
};

function DetailRow({ label, value }: { label: string; value: string }) {
  const displayValue = value?.trim() ? value : "-";
  const isEmpty = displayValue === "-";

  return (
    <div className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className={`mt-2 text-sm leading-relaxed ${isEmpty ? "italic text-slate-400" : "font-medium text-slate-800"}`}>
        {displayValue}
      </p>
    </div>
  );
}

function formatStatus(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
}

export default function EquipmentDetailPage() {
  const router = useRouter();
  const params = useParams<EquipmentDetailParams>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { equipment, isLoading, error } = useEquipmentDetail(id);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat detail alat...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-3">
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
        <Button type="button" variant="outline" onClick={() => router.push("/equipment")}>
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Peralatan
        </Button>
      </section>
    );
  }

  if (!equipment) {
    return (
      <section className="space-y-3">
        <p className="text-sm text-slate-600">Data alat tidak ditemukan.</p>
        <Button type="button" variant="outline" onClick={() => router.push("/equipment")}>
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Peralatan
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Detail Alat</h2>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={() => router.push(`/use-equipment/form?equipment=${equipment.id}`)}>
            <ClipboardPlus className="h-4 w-4" />
            Ajukan Penggunaan
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/equipment")}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>
      </div>

      {equipment.imageUrl ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img src={equipment.imageUrl} alt={equipment.name} className="h-98 w-full object-cover" />
        </div>
      ) : null}

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <DetailRow label="Nama Alat" value={equipment.name} />
        <DetailRow label="Kategori" value={equipment.category} />
        <DetailRow label="Status" value={formatStatus(equipment.status)} />
        <DetailRow label="Jumlah" value={equipment.quantity} />
        <DetailRow label="Ruangan" value={equipment.roomName} />
        <DetailRow label="Moveable" value={equipment.isMoveable ? "Ya" : "Tidak"} />
        <DetailRow label="Deskripsi" value={equipment.description || "-"} />
      </div>
    </section>
  );
}
