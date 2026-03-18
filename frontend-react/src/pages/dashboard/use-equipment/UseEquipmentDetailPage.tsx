"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Loader2,
  MapPinned,
  NotebookPen,
  UserRound,
  X,
} from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Steps } from "rsuite";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";
import StatusConfirmDialog from "@/components/dialogs/StatusConfirmDialog";
import { useUpdateUseStatus } from "@/hooks/uses/use-update-use-status";
import { useUseDetail } from "@/hooks/uses/use-uses";
import { formatDateTimeWib } from "@/lib/date-time";
import { getStatusBadgeClass } from "@/lib/status";

type UseDetailParams = {
  id?: string | string[];
};

type UseFlowStep = {
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

function getUseFlow(item: {
  status: string;
  createdAt: string;
  updatedAt: string;
}) {
  const status = normalizeStatus(item.status);

  const baseSteps: UseFlowStep[] = [
    {
      key: "submitted",
      label: "Diajukan",
      time: formatDateTimeWib(item.createdAt),
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
      key: "in-use",
      label: "Digunakan",
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
    baseSteps[2].time = formatDateTimeWib(item.updatedAt);
    return baseSteps;
  }
  if (status === "in use" || status === "in_use") {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "finish";
    baseSteps[2].time = formatDateTimeWib(item.updatedAt);
    baseSteps[3].state = "process";
    baseSteps[3].time = formatDateTimeWib(item.updatedAt);
    return baseSteps;
  }
  if (status === "completed") {
    baseSteps[1].state = "finish";
    baseSteps[2].state = "finish";
    baseSteps[3].state = "finish";
    baseSteps[3].time = formatDateTimeWib(item.updatedAt);
    baseSteps[4].state = "process";
    baseSteps[4].time = formatDateTimeWib(item.updatedAt);
    return baseSteps;
  }
  if (status === "rejected") {
    baseSteps[1].state = "error";
    baseSteps[1].label = "Ditolak";
    baseSteps[1].time = formatDateTimeWib(item.updatedAt);
    return baseSteps.slice(0, 2);
  }
  if (status === "expired") {
    baseSteps[1].state = "error";
    baseSteps[1].label = "Kedaluwarsa";
    baseSteps[1].time = formatDateTimeWib(item.updatedAt);
    return baseSteps.slice(0, 2);
  }
  baseSteps[1].state = "process";
  return baseSteps;
}

function UseFlow({ steps }: { steps: UseFlowStep[] }) {
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
          {displayValue}
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

export default function UseEquipmentDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useLoadProfile();
  const { updateUseStatus, pendingAction } = useUpdateUseStatus();
  const params = useParams<UseDetailParams>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [confirmType, setConfirmType] = useState<"approve" | "reject" | null>(
    null,
  );
  const backHref = pathname.startsWith("/use-equipment/all/")
    ? "/use-equipment/all"
    : "/use-equipment";
  const backLabel = pathname.startsWith("/use-equipment/all/")
    ? "Kembali ke Daftar Pengajuan"
    : "Kembali ke Pengajuan Saya";

  const { useItem: item, setUseItem, isLoading, error } = useUseDetail(id);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat detail pengajuan...
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

  if (!item) {
    return (
      <section className="space-y-3">
        <p className="text-sm text-slate-600">Data pengajuan booking alat tidak ditemukan.</p>
        <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      </section>
    );
  }

  const normalizedRole = normalizeRoleValue(profile?.role);
  const canReviewUse =
    pathname.startsWith("/use-equipment/all/") &&
    (normalizedRole === ROLE_VALUES.ADMIN ||
      normalizedRole === ROLE_VALUES.LECTURER ||
      normalizedRole === ROLE_VALUES.STAFF) &&
    isPendingStatus(item.status);

  const handleUseAction = async () => {
    if (!confirmType) return;

    const type = confirmType;
    const result = await updateUseStatus(item.id, type);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    const now = new Date().toISOString();
    setUseItem((current) =>
      current
        ? {
            ...current,
            status: type === "approve" ? "Approved" : "Rejected",
            updatedAt: now,
            approvedById:
              type === "approve"
                ? String(profile?.id ?? current.approvedById)
                : current.approvedById,
            approvedByName:
              type === "approve"
                ? profile?.name || current.approvedByName
                : current.approvedByName,
          }
        : current,
    );
    setConfirmType(null);

    toast.success(
      type === "approve"
        ? "Pengajuan booking alat berhasil disetujui."
        : "Pengajuan booking alat berhasil ditolak.",
    );
  };

  const flowSteps = getUseFlow({
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });

  return (
    <section className="space-y-4">
      <div className="rounded-xl flex items-start justify-between gap-4 border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-start gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-300">Detail Request</p>
              <h2 className="mt-1 font-bold text-xl text-slate-50">
                {item.code}
              </h2>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canReviewUse ? (
            <>
              <Button
                type="button"
                className="h-10 rounded-md border border-emerald-600 bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
                onClick={() => setConfirmType("approve")}
                disabled={pendingAction.useId === item.id}
              >
                <Check className="h-4 w-4" />
                Setujui
              </Button>
              <Button
                type="button"
                className="h-10 rounded-md border border-rose-600 bg-rose-600 px-4 text-white shadow-sm hover:bg-rose-700"
                onClick={() => setConfirmType("reject")}
                disabled={pendingAction.useId === item.id}
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

      <div className="rounded-xl border border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100/80 p-5">
        <h3 className="text-sm font-semibold text-slate-900">Status</h3>
        <UseFlow steps={flowSteps} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <DetailSection
            title="Informasi Alat"
            icon={<MapPinned className="h-4 w-4" />}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="Alat" value={item.equipmentName} />
              <DetailItem label="Ruangan" value={item.roomName || "-"} />
              <DetailItem label="Jumlah" value={item.quantity} />
            </div>
          </DetailSection>

          <DetailSection
            title="Waktu Pengajuan"
            icon={<CalendarClock className="h-4 w-4" />}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem
                label="Waktu Mulai (WIB)"
                value={formatDateTimeWib(item.startTime)}
              />
              <DetailItem
                label="Waktu Selesai (WIB)"
                value={formatDateTimeWib(item.endTime)}
              />
              <DetailItem
                label="Status Saat Ini"
                value={item.status}
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
              <DetailItem label="Peminjam" value={item.requesterName} />
              <DetailItem
                label="Disetujui Oleh"
                value={item.approvedByName || "-"}
              />
            </div>
          </DetailSection>

          <DetailSection
            title="Keterangan Pengajuan"
            icon={<NotebookPen className="h-4 w-4" />}
          >
            <div className="grid gap-3">
              <DetailItem label="Tujuan" value={item.purpose} />
              <DetailItem label="Catatan" value={item.note || "-"} />
            </div>
          </DetailSection>
        </div>
      </div>

      <StatusConfirmDialog
        open={Boolean(confirmType)}
        actionType={confirmType}
        onOpenChange={(open) => {
          if (!open) setConfirmType(null);
        }}
        onConfirm={handleUseAction}
        isSubmitting={pendingAction.useId === item.id}
        subjectLabel="pengajuan penggunaan alat ini"
      />
    </section>
  );
}
