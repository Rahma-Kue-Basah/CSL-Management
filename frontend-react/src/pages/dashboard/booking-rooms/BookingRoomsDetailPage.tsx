"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  MapPinned,
  NotebookPen,
  UserRound,
} from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DashboardDetailReviewPanel } from "@/components/dashboard/layout/DashboardDetailReviewPanel";
import { ProgressSteps } from "@/components/shared/progress-steps";
import { Skeleton } from "@/components/ui/skeleton";
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

function hasDisplayValue(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim();
  return normalized !== "" && normalized !== "-";
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
      time: formatDateTimeWib(booking.createdAt),
      state: "finish",
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
    return baseSteps;
  }
  if (status === "approved") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = formatDateTimeWib(booking.updatedAt);
    baseSteps[2].state = "process";
    return baseSteps;
  }
  if (status === "completed") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = formatDateTimeWib(booking.updatedAt);
    baseSteps[2].state = "finish";
    baseSteps[2].time = formatDateTimeWib(booking.updatedAt);
    return baseSteps;
  }
  if (status === "rejected") {
    baseSteps[1] = {
      key: "rejected",
      label: "Ditolak",
      time: formatDateTimeWib(booking.updatedAt),
      state: "error",
    };
    return baseSteps.slice(0, 2);
  }
  if (status === "expired") {
    baseSteps[1] = {
      key: "expired",
      label: "Kedaluwarsa",
      time: formatDateTimeWib(booking.updatedAt),
      state: "error",
    };
    return baseSteps.slice(0, 2);
  }
  return baseSteps;
}

function BookingFlow({ steps }: { steps: BookingFlowStep[] }) {
  return (
    <ProgressSteps steps={steps} minWidthClassName="min-w-[720px]" />
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

function DetailCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function DetailMetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!hasDisplayValue(value)) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-right text-xs leading-5 text-slate-800">{value}</p>
    </div>
  );
}

function BookingDetailSkeleton() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-44 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4">
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
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
  const isApprovalPage = pathname.startsWith("/booking-rooms/approval/");
  const [reloadKey, setReloadKey] = useState(0);

  const { booking, isLoading, error } = useBookingDetail(id, reloadKey);

  if (isLoading) {
    return <BookingDetailSkeleton />;
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

      <div
        className={
          isApprovalPage
            ? "grid gap-4 xl:grid-cols-[1.35fr_0.65fr]"
            : "grid gap-4 xl:grid-cols-[1.1fr_0.9fr]"
        }
      >
        {isApprovalPage ? (
          <>
            <div className="space-y-4">
              <DetailCard
                title="Detail Peminjaman Lab"
                subtitle="Ringkasan data permohonan yang diajukan oleh pemohon."
                icon={<MapPinned className="h-4 w-4" />}
              >
                <DetailMetaItem label="Ruangan" value={booking.roomName} />
                <DetailMetaItem
                  label="Nomor Ruangan"
                  value={booking.roomNumber || "-"}
                />
                <DetailMetaItem
                  label="Waktu Mulai"
                  value={formatDateTimeWib(booking.startTime)}
                />
                <DetailMetaItem
                  label="Waktu Selesai"
                  value={formatDateTimeWib(booking.endTime)}
                />
                <DetailMetaItem label="Jumlah Peserta" value={booking.attendeeCount} />
                <DetailMetaItem label="Nama Peserta" value={booking.attendeeNames} />
                <DetailMetaItem label="Tujuan" value={booking.purpose} />
                <DetailMetaItem
                  label="Nomor Telepon Pemohon"
                  value={booking.requesterPhone}
                />
                <DetailMetaItem
                  label="Dosen Pembimbing"
                  value={booking.requesterMentor}
                />
                <DetailMetaItem label="Institusi" value={booking.institution} />
                <DetailMetaItem
                  label="Alamat Institusi"
                  value={booking.institutionAddress}
                />
                <DetailMetaItem
                  label="Judul Workshop"
                  value={booking.workshopTitle}
                />
                <DetailMetaItem label="PIC Workshop" value={booking.workshopPic} />
                <DetailMetaItem
                  label="Institusi Workshop"
                  value={booking.workshopInstitution}
                />
                <DetailMetaItem label="Catatan" value={booking.note || "-"} />
              </DetailCard>

              {booking.equipmentItems.length ? (
                <DetailCard
                  title="Peralatan Tambahan"
                  subtitle="Daftar peralatan pendukung yang ikut diminta dalam pengajuan."
                  icon={<NotebookPen className="h-4 w-4" />}
                >
                  {booking.equipmentItems.map((item) => (
                    <div
                      key={item.id || `${item.equipmentName}-${item.quantity}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3"
                    >
                      <p className="text-xs text-slate-800">{item.equipmentName}</p>
                      <p className="text-right text-xs font-medium leading-5 text-slate-800">
                        {item.quantity}
                      </p>
                    </div>
                  ))}
                </DetailCard>
              ) : null}

              <DetailCard
                title="Informasi Permohonan"
                subtitle="Informasi utama permohonan dan hasil persetujuan saat ini."
                icon={<UserRound className="h-4 w-4" />}
              >
                <DetailMetaItem label="Pemohon" value={booking.requesterName} />
                <DetailMetaItem
                  label="Status Saat Ini"
                  value={getStatusDisplayLabel(booking.status)}
                />
                <DetailMetaItem
                  label="Disetujui Oleh"
                  value={booking.approvedByName || "-"}
                />
              </DetailCard>
            </div>

            <div className="space-y-4">
              {id ? (
                <DashboardDetailReviewPanel
                  context={{ kind: "booking", id }}
                  onActionComplete={() => setReloadKey((prev) => prev + 1)}
                />
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <DetailCard
                title="Detail Peminjaman Lab"
                subtitle="Ringkasan data permohonan yang diajukan oleh pemohon."
                icon={<MapPinned className="h-4 w-4" />}
              >
                <DetailMetaItem label="Ruangan" value={booking.roomName} />
                <DetailMetaItem
                  label="Nomor Ruangan"
                  value={booking.roomNumber || "-"}
                />
                <DetailMetaItem
                  label="Waktu Mulai"
                  value={formatDateTimeWib(booking.startTime)}
                />
                <DetailMetaItem
                  label="Waktu Selesai"
                  value={formatDateTimeWib(booking.endTime)}
                />
                <DetailMetaItem label="Jumlah Peserta" value={booking.attendeeCount} />
                <DetailMetaItem label="Nama Peserta" value={booking.attendeeNames} />
                <DetailMetaItem label="Tujuan" value={booking.purpose} />
                <DetailMetaItem
                  label="Nomor Telepon Pemohon"
                  value={booking.requesterPhone}
                />
                <DetailMetaItem
                  label="Dosen Pembimbing"
                  value={booking.requesterMentor}
                />
                <DetailMetaItem label="Institusi" value={booking.institution} />
                <DetailMetaItem
                  label="Alamat Institusi"
                  value={booking.institutionAddress}
                />
                <DetailMetaItem
                  label="Judul Workshop"
                  value={booking.workshopTitle}
                />
                <DetailMetaItem label="PIC Workshop" value={booking.workshopPic} />
                <DetailMetaItem
                  label="Institusi Workshop"
                  value={booking.workshopInstitution}
                />
                <DetailMetaItem label="Catatan" value={booking.note || "-"} />
              </DetailCard>

              {booking.equipmentItems.length ? (
                <DetailCard
                  title="Peralatan Tambahan"
                  subtitle="Daftar peralatan pendukung yang ikut diminta dalam pengajuan."
                  icon={<NotebookPen className="h-4 w-4" />}
                >
                  {booking.equipmentItems.map((item) => (
                    <div
                      key={item.id || `${item.equipmentName}-${item.quantity}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3"
                    >
                      <p className="text-xs text-slate-800">{item.equipmentName}</p>
                      <p className="text-right text-xs font-medium leading-5 text-slate-800">
                        {item.quantity}
                      </p>
                    </div>
                  ))}
                </DetailCard>
              ) : null}
            </div>

            <div className="space-y-4">
              <DetailCard
                title="Informasi Permohonan"
                subtitle="Informasi utama permohonan dan hasil persetujuan saat ini."
                icon={<UserRound className="h-4 w-4" />}
              >
                <DetailMetaItem label="Pemohon" value={booking.requesterName} />
                <DetailMetaItem
                  label="Status Saat Ini"
                  value={getStatusDisplayLabel(booking.status)}
                />
                <DetailMetaItem
                  label="Disetujui Oleh"
                  value={booking.approvedByName || "-"}
                />
              </DetailCard>
            </div>
          </>
        )}
      </div>

    </section>
  );
}
