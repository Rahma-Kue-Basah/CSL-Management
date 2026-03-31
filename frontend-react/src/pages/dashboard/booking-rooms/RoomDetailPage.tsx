"use client";

import { ArrowLeft, CalendarPlus2, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useRoomDetail } from "@/hooks/rooms/use-rooms";

type RoomDetailParams = {
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

export default function RoomDetailPage() {
  const router = useRouter();
  const params = useParams<RoomDetailParams>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { room, isLoading, error } = useRoomDetail(id);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat detail ruangan...
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
        <Button type="button" variant="outline" onClick={() => router.push("/rooms")}>
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Ruangan
        </Button>
      </section>
    );
  }

  if (!room) {
    return (
      <section className="space-y-3">
        <p className="text-sm text-slate-600">Data ruangan tidak ditemukan.</p>
        <Button type="button" variant="outline" onClick={() => router.push("/rooms")}>
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Ruangan
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Detail Ruangan</h2>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={() => router.push(`/booking-rooms/form?room=${room.id}`)}>
            <CalendarPlus2 className="h-4 w-4" />
            Ajukan Booking
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/rooms")}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>
      </div>

      {room.imageUrl ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img src={room.imageUrl} alt={room.name} className="h-98 w-full object-cover" />
        </div>
      ) : null}

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <DetailRow label="Nama Ruangan" value={room.name} />
        <DetailRow label="Nomor Ruangan" value={room.number} />
        <DetailRow label="Lantai" value={room.floor} />
        <DetailRow label="Kapasitas" value={room.capacity} />
        <DetailRow label="PIC" value={room.picName} />
        <DetailRow label="Deskripsi" value={room.description || "-"} />
      </div>
    </section>
  );
}
