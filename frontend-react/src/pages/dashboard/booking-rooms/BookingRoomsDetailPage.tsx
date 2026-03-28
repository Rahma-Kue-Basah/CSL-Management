"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Loader2,
  MapPinned,
  NotebookPen,
  UserRound,
} from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Steps } from "rsuite";

import { Button } from "@/components/ui/button";
import { useBookingDetail } from "@/hooks/bookings/use-bookings";
import { formatDateTimeWib } from "@/lib/date-format";
import { getStatusBadgeClass, getStatusDisplayLabel } from "@/lib/status";

type BookingDetailParams = {
  id?: string | string[];
};

type BookingFlowStep = {
  key: string;
  label: string;
  time?: string;
  state: "finish" | "process" | "wait" | "error";
};

function normalizeStatus(value: string) {
  return value.toLowerCase();
}

function isPendingStatus(value: string) {
  return normalizeStatus(value) === "pending";
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
      time: formatDateTimeWib(booking.createdAt),
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
    baseSteps[2].time = formatDateTimeWib(booking.updatedAt);
    return baseSteps;
  }
  if (status === "completed") {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "finish";
    baseSteps[2].time = formatDateTimeWib(booking.updatedAt);
    baseSteps[3].state = "process";
    baseSteps[3].time = formatDateTimeWib(booking.updatedAt);
    return baseSteps;
  }
  if (status === "rejected") {
    baseSteps[1].state = "error";
    baseSteps[1].label = "Ditolak";
    baseSteps[1].time = formatDateTimeWib(booking.updatedAt);
    return baseSteps.slice(0, 2);
  }
  if (status === "expired") {
    baseSteps[1].state = "error";
    baseSteps[1].label = "Kedaluwarsa";
    baseSteps[1].time = formatDateTimeWib(booking.updatedAt);
    return baseSteps.slice(0, 2);
  }
  baseSteps[1].state = "process";
  return baseSteps;
}

function BookingFlow({ steps }: { steps: BookingFlowStep[] }) {
  const currentIndex = Math.max(
    0,
    steps.findIndex(
      (step) => step.state === "process" || step.state === "error",
    ),
  );

  return (
    <div className="booking-flow mt-3 overflow-x-auto pb-1">
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

function DetailItem({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "status";
}) {
  const displayValue = value?.trim() ? value : "-";
  const isEmpty = displayValue === "-";

  return (
    <div className="space-y-1.5 rounded-md border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      {variant === "status" && !isEmpty ? (
        <span
          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(displayValue)}`}
        >
          {getStatusDisplayLabel(displayValue)}
        </span>
      ) : (
        <p
          className={`text-sm leading-relaxed ${isEmpty ? "italic text-slate-400" : "text-slate-800"}`}
        >
          {displayValue}
        </p>
      )}
    </div>
  );
}

function EquipmentItemsDetail({
  items,
}: {
  items: Array<{
    id: string;
    equipmentName: string;
    quantity: string;
  }>;
}) {
  if (!items.length) {
    return <DetailItem label="Peralatan (Opsional)" value="-" />;
  }

  return (
    <div className="space-y-1.5 rounded-md border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">Peralatan (Opsional)</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id || `${item.equipmentName}-${item.quantity}`}
            className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
          >
            <span>{item.equipmentName}</span>
            <span className="font-medium">{item.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-400/50 bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
          {icon}
        </div>
        <div>
          <h3 className="text-sm text-slate-900">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function BookingRoomsDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<BookingDetailParams>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const backHref = pathname.startsWith("/booking-rooms/approval/")
    ? "/booking-rooms/approval"
    : "/booking-rooms";
  const backLabel = pathname.startsWith("/booking-rooms/approval/")
    ? "Kembali ke Daftar Pengajuan"
    : "Kembali ke Pengajuan Saya";

  const { booking, setBooking, isLoading, error } = useBookingDetail(id);

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
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(backHref)}
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="space-y-3">
        <p className="text-sm text-slate-600">Data booking tidak ditemukan.</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(backHref)}
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
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
      <div className="rounded-xl flex items-start justify-between gap-4 border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-start gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-300">Detail Request</p>
              <h2 className="mt-1 font-bold text-xl text-slate-50">
                {booking.code}
              </h2>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(backHref)}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100/80 p-5">
        <h3 className="text-sm font-semibold text-slate-900">
          Status
        </h3>
        <BookingFlow steps={flowSteps} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <DetailSection
            title="Informasi Ruangan"
            icon={<MapPinned className="h-4 w-4" />}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="Ruangan" value={booking.roomName} />
              <DetailItem
                label="Nomor Ruangan"
                value={booking.roomNumber || "-"}
              />
              <DetailItem label="Jumlah Orang" value={booking.attendeeCount} />
              <DetailItem label="Nama Orang" value={booking.attendeeNames} />
              <EquipmentItemsDetail items={booking.equipmentItems} />
            </div>
          </DetailSection>

          <DetailSection
            title="Waktu Pengajuan"
            icon={<CalendarClock className="h-4 w-4" />}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem
                label="Waktu Mulai (WIB)"
                value={formatDateTimeWib(booking.startTime)}
              />
              <DetailItem
                label="Waktu Selesai (WIB)"
                value={formatDateTimeWib(booking.endTime)}
              />
              <DetailItem
                label="Status Saat Ini"
                value={booking.status}
                variant="status"
              />
            </div>
          </DetailSection>
        </div>

        <div className="space-y-4">
          <DetailSection
            title="Informasi Pemohon"
            icon={<UserRound className="h-4 w-4" />}
          >
            <div className="grid gap-3">
              <DetailItem label="Peminjam" value={booking.requesterName} />
              <DetailItem
                label="Disetujui Oleh"
                value={booking.approvedByName || "-"}
              />
            </div>
          </DetailSection>

          <DetailSection
            title="Keterangan Pengajuan"
            icon={<NotebookPen className="h-4 w-4" />}
          >
            <div className="grid gap-3">
              <DetailItem label="Tujuan" value={booking.purpose} />
              <DetailItem label="Catatan" value={booking.note || "-"} />
            </div>
          </DetailSection>
        </div>
      </div>

    </section>
  );
}
