"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Steps } from "rsuite";

import { Button } from "@/components/ui/button";
import { useBookingDetail } from "@/hooks/bookings/use-bookings";

type BookingDetailParams = {
  id?: string | string[];
};

type BookingFlowStep = {
  key: string;
  label: string;
  time?: string;
  state: "finish" | "process" | "wait" | "error";
};

function formatDateTime(value?: string | null) {
  if (!value || value === "-") return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function normalizeStatus(value: string) {
  return value.toLowerCase();
}

function getBookingFlow(booking: {
  status: string;
  createdAt: string;
  updatedAt: string;
}) {
  const status = normalizeStatus(booking.status);

  const baseSteps: BookingFlowStep[] = [
    {
      key: "submitted",
      label: "Diajukan",
      time: formatDateTime(booking.createdAt),
      state: "finish",
    },
    {
      key: "review",
      label: "Diproses",
      state: "wait",
    },
    {
      key: "approved",
      label: "Disetujui",
      state: "wait",
    },
    {
      key: "completed",
      label: "Selesai",
      state: "wait",
    },
  ];

  if (status === "pending") {
    baseSteps[1].state = "process";
    return baseSteps;
  }
  if (status === "approved") {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "process";
    baseSteps[2].time = formatDateTime(booking.updatedAt);
    return baseSteps;
  }
  if (status === "completed") {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "finish";
    baseSteps[2].time = formatDateTime(booking.updatedAt);
    baseSteps[3].state = "process";
    baseSteps[3].time = formatDateTime(booking.updatedAt);
    return baseSteps;
  }
  if (status === "rejected") {
    baseSteps[1].state = "error";
    baseSteps[1].label = "Ditolak";
    baseSteps[1].time = formatDateTime(booking.updatedAt);
    return baseSteps.slice(0, 2);
  }
  if (status === "cancelled") {
    baseSteps[1].state = "error";
    baseSteps[1].label = "Dibatalkan";
    baseSteps[1].time = formatDateTime(booking.updatedAt);
    return baseSteps.slice(0, 2);
  }

  baseSteps[1].state = "process";
  return baseSteps;
}

function BookingFlow({ steps }: { steps: BookingFlowStep[] }) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.state === "process" || step.state === "error"),
  );

  return (
    <div className="mt-3 overflow-x-auto pb-1">
      <Steps current={currentIndex} className="min-w-[720px]">
        {steps.map((step) => (
          <Steps.Item
            key={step.key}
            title={step.label}
            status={step.state}
            description={step.time || " "}
          />
        ))}
      </Steps>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const displayValue = value?.trim() ? value : "-";
  const isEmpty = displayValue === "-";

  return (
    <div className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-colors hover:border-slate-300">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className={`mt-2 text-sm leading-relaxed ${isEmpty ? "italic text-slate-400" : "font-medium text-slate-800"}`}>
        {displayValue}
      </p>
    </div>
  );
}

export default function BookingRoomsDetailPage() {
  const router = useRouter();
  const params = useParams<BookingDetailParams>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { booking, isLoading, error } = useBookingDetail(id);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat detail booking...
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
        <Button type="button" variant="outline" onClick={() => router.push("/booking-rooms")}>
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pengajuan Saya
        </Button>
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="space-y-3">
        <p className="text-sm text-slate-600">Data booking tidak ditemukan.</p>
        <Button type="button" variant="outline" onClick={() => router.push("/booking-rooms")}>
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pengajuan Saya
        </Button>
      </section>
    );
  }

  const flowSteps = getBookingFlow({
    status: booking.status,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Detail Booking Ruangan</h2>
        <Button type="button" variant="outline" onClick={() => router.push("/booking-rooms")}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Alur Status Booking</h3>
        <BookingFlow steps={flowSteps} />
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <DetailRow label="Kode" value={booking.code} />
        <DetailRow label="Status" value={booking.status} />
        <DetailRow label="Ruangan" value={booking.roomName} />
        <DetailRow label="Nomor Ruangan" value={booking.roomNumber || "-"} />
        <DetailRow label="Peminjam" value={booking.requesterName} />
        <DetailRow label="Disetujui Oleh" value={booking.approvedByName || "-"} />
        <DetailRow label="Peralatan (Opsional)" value={booking.equipmentName || "-"} />
        <DetailRow label="Jumlah Peralatan" value={booking.equipmentQty || "-"} />
        <DetailRow label="Waktu Mulai" value={formatDateTime(booking.startTime)} />
        <DetailRow label="Waktu Selesai" value={formatDateTime(booking.endTime)} />
        <DetailRow label="Dibuat Pada" value={formatDateTime(booking.createdAt)} />
        <DetailRow label="Tujuan" value={booking.purpose} />
        <DetailRow label="Catatan" value={booking.note || "-"} />
      </div>
    </section>
  );
}
