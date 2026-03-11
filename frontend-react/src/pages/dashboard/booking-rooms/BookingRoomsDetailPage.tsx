"use client";

import { useState } from "react";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Steps } from "rsuite";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useBookingDetail } from "@/hooks/bookings/use-bookings";
import { useUpdateBookingStatus } from "@/hooks/bookings/use-update-booking-status";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";
import BookingStatusConfirmDialog from "@/pages/dashboard/booking-rooms/BookingStatusConfirmDialog";

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
  const pathname = usePathname();
  const { profile } = useLoadProfile();
  const { updateBookingStatus, pendingAction } = useUpdateBookingStatus();
  const params = useParams<BookingDetailParams>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [confirmType, setConfirmType] = useState<"approve" | "reject" | null>(null);
  const backHref = pathname.startsWith("/booking-rooms/all/")
    ? "/booking-rooms/all"
    : "/booking-rooms";
  const backLabel = pathname.startsWith("/booking-rooms/all/")
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
        <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
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
        <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      </section>
    );
  }

  const normalizedRole = normalizeRoleValue(profile?.role);
  const canReviewBooking =
    pathname.startsWith("/booking-rooms/all/") &&
    (normalizedRole === ROLE_VALUES.ADMIN ||
      normalizedRole === ROLE_VALUES.LECTURER ||
      normalizedRole === ROLE_VALUES.STAFF) &&
    isPendingStatus(booking.status);

  const handleBookingAction = async () => {
    if (!confirmType) return;

    const type = confirmType;
    const result = await updateBookingStatus(booking.id, type);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    const now = new Date().toISOString();
    setBooking((current) =>
      current
        ? {
            ...current,
            status: type === "approve" ? "Approved" : "Rejected",
            updatedAt: now,
            approvedById:
              type === "approve" ? String(profile?.id ?? current.approvedById) : current.approvedById,
            approvedByName:
              type === "approve"
                ? profile?.name || current.approvedByName
                : current.approvedByName,
            approvedByEmail:
              type === "approve"
                ? profile?.email || current.approvedByEmail
                : current.approvedByEmail,
          }
        : current,
    );
    setConfirmType(null);

    toast.success(
      type === "approve"
        ? "Pengajuan booking berhasil disetujui."
        : "Pengajuan booking berhasil ditolak.",
    );
  };

  const flowSteps = getBookingFlow({
    status: booking.status,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Detail Booking Ruangan</h2>
        <div className="flex items-center gap-2">
          {canReviewBooking ? (
            <>
              <Button
                type="button"
                className="h-10 rounded-md border border-emerald-600 bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
                onClick={() => setConfirmType("approve")}
                disabled={pendingAction.bookingId === booking.id}
              >
                <Check className="h-4 w-4" />
                Setujui
              </Button>
              <Button
                type="button"
                className="h-10 rounded-md border border-rose-600 bg-rose-600 px-4 text-white shadow-sm hover:bg-rose-700"
                onClick={() => setConfirmType("reject")}
                disabled={pendingAction.bookingId === booking.id}
              >
                <X className="h-4 w-4" />
                Tolak
              </Button>
            </>
          ) : null}
          <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>
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

      <BookingStatusConfirmDialog
        open={Boolean(confirmType)}
        actionType={confirmType}
        onOpenChange={(open) => {
          if (!open) setConfirmType(null);
        }}
        onConfirm={handleBookingAction}
        isSubmitting={pendingAction.bookingId === booking.id}
      />
    </section>
  );
}
