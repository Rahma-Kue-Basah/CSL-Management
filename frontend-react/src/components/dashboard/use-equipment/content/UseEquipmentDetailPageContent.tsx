"use client";


import { useState } from "react";

import {
  ArrowLeft,
  MapPinned,
  UserRound,
} from "lucide-react";

import { useParams, usePathname, useRouter } from "next/navigation";

import { Button, Skeleton } from "@/components/ui";

import { DashboardDetailReviewPanel } from "@/components/dashboard/layout";

import { ProgressSteps, RequestInformationCard, RequestProgressDialog } from "@/components/shared";

import { useUseDetail } from "@/hooks/use-equipment";

import { formatDateTimeWib } from "@/lib/date";

import { getUseProgressFlow } from "@/lib/request";

import {
  getMentorApprovalStageLabel,
  hasMentorApprovalTrace,
} from "@/lib/request";

type UseDetailParams = {
  id?: string | string[];
};

function hasDisplayValue(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim();
  return normalized !== "" && normalized !== "-";
}

function UseFlow({ steps }: { steps: ReturnType<typeof getUseProgressFlow> }) {
  return (
    <ProgressSteps steps={steps} minWidthClassName="min-w-[720px]" />
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
    <div className="grid gap-1 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start md:gap-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xs leading-5 text-slate-800 break-words">{value}</p>
    </div>
  );
}

function UseDetailSkeleton() {
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
              <Skeleton className="h-20 w-full rounded-md" />
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

export default function UseEquipmentDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<UseDetailParams>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const backHref = pathname.startsWith("/use-equipment/approval/")
    ? "/use-equipment/approval"
    : "/use-equipment";
  const backLabel = pathname.startsWith("/use-equipment/approval/")
    ? "Kembali ke Daftar Pengajuan"
    : "Kembali ke Pengajuan Saya";
  const isApprovalPage = pathname.startsWith("/use-equipment/approval/");
  const [reloadKey, setReloadKey] = useState(0);
  const [progressOpen, setProgressOpen] = useState(false);

  const { useItem: item, isLoading, error } = useUseDetail(id, reloadKey);

  if (isLoading) {
    return <UseDetailSkeleton />;
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
        <p className="text-sm text-slate-600">Data pengajuan penggunaan alat tidak ditemukan.</p>
        <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      </section>
    );
  }

  const flowSteps = getUseProgressFlow(item);

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
                title="Detail Penggunaan Alat"
                subtitle="Ringkasan data penggunaan alat yang diisi oleh pemohon."
                icon={<MapPinned className="h-4 w-4" />}
              >
                <DetailMetaItem label="Alat" value={item.equipmentName} />
                <DetailMetaItem label="Ruangan" value={item.roomName || "-"} />
                <DetailMetaItem label="Jumlah" value={item.quantity} />
                <DetailMetaItem
                  label="Waktu Mulai"
                  value={formatDateTimeWib(item.startTime)}
                />
                <DetailMetaItem
                  label="Waktu Selesai"
                  value={formatDateTimeWib(item.endTime)}
                />
                <DetailMetaItem label="Tujuan" value={item.purpose} />
                <DetailMetaItem
                  label="Nomor Telepon Pemohon"
                  value={item.requesterPhone}
                />
                <DetailMetaItem
                  label="Dosen Pembimbing"
                  value={item.requesterMentor}
                />
                <DetailMetaItem label="Institusi" value={item.institution} />
                <DetailMetaItem
                  label="Alamat Institusi"
                  value={item.institutionAddress}
                />
                <DetailMetaItem label="Catatan" value={item.note || "-"} />
              </DetailCard>

              <RequestInformationCard
                icon={<UserRound className="h-4 w-4" />}
                requesterName={item.requesterName}
                requesterDepartment={item.requesterDepartment}
                status={item.status}
                onStatusClick={() => setProgressOpen(true)}
                approvedByName={item.approvedByName}
                rejectionNote={item.rejectionNote}
              >
                {hasMentorApprovalTrace(item) ? (
                  <>
                    <DetailMetaItem
                      label="Tahap Dosen Pembimbing"
                      value={getMentorApprovalStageLabel(item)}
                    />
                    <DetailMetaItem
                      label="Waktu Persetujuan Dosen Pembimbing"
                      value={formatDateTimeWib(item.mentorApprovedAt)}
                    />
                  </>
                ) : null}
              </RequestInformationCard>
            </div>

            <div className="space-y-4">
              {id ? (
                <DashboardDetailReviewPanel
                  context={{ kind: "use", id }}
                  initialUseItem={item}
                  onActionComplete={() => setReloadKey((prev) => prev + 1)}
                />
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <DetailCard
                title="Detail Penggunaan Alat"
                subtitle="Ringkasan data penggunaan alat yang diisi oleh pemohon."
                icon={<MapPinned className="h-4 w-4" />}
              >
                <DetailMetaItem label="Alat" value={item.equipmentName} />
                <DetailMetaItem label="Ruangan" value={item.roomName || "-"} />
                <DetailMetaItem label="Jumlah" value={item.quantity} />
                <DetailMetaItem
                  label="Waktu Mulai"
                  value={formatDateTimeWib(item.startTime)}
                />
                <DetailMetaItem
                  label="Waktu Selesai"
                  value={formatDateTimeWib(item.endTime)}
                />
                <DetailMetaItem label="Tujuan" value={item.purpose} />
                <DetailMetaItem
                  label="Nomor Telepon Pemohon"
                  value={item.requesterPhone}
                />
                <DetailMetaItem
                  label="Dosen Pembimbing"
                  value={item.requesterMentor}
                />
                <DetailMetaItem label="Institusi" value={item.institution} />
                <DetailMetaItem
                  label="Alamat Institusi"
                  value={item.institutionAddress}
                />
                <DetailMetaItem label="Catatan" value={item.note || "-"} />
              </DetailCard>
            </div>

            <div className="space-y-4">
              <RequestInformationCard
                icon={<UserRound className="h-4 w-4" />}
                requesterName={item.requesterName}
                requesterDepartment={item.requesterDepartment}
                status={item.status}
                onStatusClick={() => setProgressOpen(true)}
                approvedByName={item.approvedByName}
                rejectionNote={item.rejectionNote}
              >
                {hasMentorApprovalTrace(item) ? (
                  <>
                    <DetailMetaItem
                      label="Tahap Dosen Pembimbing"
                      value={getMentorApprovalStageLabel(item)}
                    />
                    <DetailMetaItem
                      label="Waktu Persetujuan Dosen Pembimbing"
                      value={formatDateTimeWib(item.mentorApprovedAt)}
                    />
                  </>
                ) : null}
              </RequestInformationCard>
            </div>
          </>
        )}
      </div>
      <RequestProgressDialog
        open={progressOpen}
        onOpenChange={setProgressOpen}
        title="Progress Penggunaan Alat"
        code={item.code}
        steps={getUseProgressFlow(item)}
      />
    </section>
  );
}
