"use client";

import { useState } from "react";
import { ArrowLeft, ClipboardList, FlaskConical, UserRound } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { DashboardDetailReviewPanel } from "@/components/dashboard/layout/DashboardDetailReviewPanel";
import {
  SampleTestingMetaItem,
  SampleTestingSectionCard,
} from "@/components/dashboard/sample-testing/content/SampleTestingDetailContent";
import SampleTestingDocumentsSection from "@/components/dashboard/sample-testing/SampleTestingDocumentsSection";
import { RequestInformationCard } from "@/components/shared/RequestInformationCard";
import { RequestProgressDialog } from "@/components/shared/RequestProgressDialog";
import { ProgressSteps } from "@/components/shared/ProgressSteps";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSampleTestingDetail } from "@/hooks/sample-testing/use-sample-testing";
import { formatDateTimeWib } from "@/lib/date/format";
import { getSampleTestingProgressFlow } from "@/lib/request/progress";
import { getStatusBadgeClass, getStatusDisplayLabel } from "@/lib/request/status";

function SampleTestingDetailSkeleton() {
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <Skeleton className="h-4 w-24 bg-slate-700" />
        <Skeleton className="mt-2 h-7 w-40 bg-slate-700" />
        <Skeleton className="mt-3 h-7 w-24 rounded-full bg-slate-700" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Skeleton className="min-h-[520px] rounded-xl" />
        <Skeleton className="min-h-[280px] rounded-xl" />
      </div>
    </section>
  );
}

export default function SampleTestingDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [reloadKey, setReloadKey] = useState(0);
  const [progressOpen, setProgressOpen] = useState(false);
  const { sampleTesting: item, isLoading, error } = useSampleTestingDetail(
    id ?? null,
    reloadKey,
    { enabled: true },
  );

  const isApprovalPage = location.pathname.startsWith("/sample-testing/approval/");
  const backHref = isApprovalPage ? "/sample-testing/approval" : "/sample-testing";
  const backLabel = isApprovalPage
    ? "Kembali ke Daftar Pengajuan"
    : "Kembali ke Pengajuan Saya";

  if (isLoading) return <SampleTestingDetailSkeleton />;

  if (error) {
    return (
      <section className="space-y-3">
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
        <Button type="button" variant="outline" onClick={() => navigate(backHref)}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="space-y-3">
        <p className="text-sm text-slate-600">Data pengajuan pengujian sampel tidak ditemukan.</p>
        <Button type="button" variant="outline" onClick={() => navigate(backHref)}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div>
          <p className="text-xs text-slate-300">Detail Request</p>
          <h2 className="mt-1 text-xl font-bold text-slate-50">{item.code}</h2>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setProgressOpen(true)}
              className={`inline-flex cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(item.status)}`}
            >
              {getStatusDisplayLabel(item.status)}
            </button>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => navigate(backHref)}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-1 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Progress Pengajuan</h3>
        </div>
        <ProgressSteps
          steps={getSampleTestingProgressFlow(item)}
          minWidthClassName="min-w-[760px]"
        />
      </div>

      {isApprovalPage ? (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            <SampleTestingDocumentsSection
              item={item}
              viewerRole="approver"
              onUploaded={() => setReloadKey((prev) => prev + 1)}
            />

            <SampleTestingSectionCard
              title="Detail Pengujian Sampel"
              subtitle="Ringkasan informasi sampel dan pengujian yang diajukan."
              icon={<FlaskConical className="h-5 w-5" />}
            >
              <SampleTestingMetaItem label="Nama Sampel" value={item.sampleName} />
              <SampleTestingMetaItem label="Jenis Sampel" value={item.sampleType} />
              <SampleTestingMetaItem label="Merek Sampel" value={item.sampleBrand} />
              <SampleTestingMetaItem label="Kemasan Sampel" value={item.samplePackaging} />
              <SampleTestingMetaItem label="Berat Sampel" value={item.sampleWeight} />
              <SampleTestingMetaItem label="Jumlah Sampel" value={item.sampleQuantity} />
              <SampleTestingMetaItem
                label="Cara Penyajian / Penanganan"
                value={item.sampleTestingServing}
              />
              <SampleTestingMetaItem
                label="Metode Pengujian"
                value={item.sampleTestingMethod}
              />
              <SampleTestingMetaItem
                label="Jenis Pengujian"
                value={item.sampleTestingType}
              />
            </SampleTestingSectionCard>
          </div>
          <div className="space-y-4">
            {id ? (
              <DashboardDetailReviewPanel
                context={{ kind: "sample-testing", id }}
                initialSampleTesting={item}
                onActionComplete={() => setReloadKey((prev) => prev + 1)}
              />
            ) : null}

            <SampleTestingSectionCard
              title="Informasi Pemohon"
              subtitle="Identitas pemohon dan informasi institusi yang dicantumkan saat pengajuan."
              icon={<UserRound className="h-5 w-5" />}
            >
              <SampleTestingMetaItem label="Nama Pemohon" value={item.name} />
              <SampleTestingMetaItem label="Institusi" value={item.institution} />
              <SampleTestingMetaItem
                label="Alamat Institusi"
                value={item.institutionAddress}
              />
              <SampleTestingMetaItem label="Email" value={item.email} />
              <SampleTestingMetaItem label="Nomor Telepon" value={item.phoneNumber} />

            </SampleTestingSectionCard>

            <RequestInformationCard
              icon={<ClipboardList className="h-4 w-4" />}
              requesterName={item.name}
              requesterDepartment={item.requesterDepartment}
              status={item.status}
              onStatusClick={() => setProgressOpen(true)}
              approvedByName={item.approvedByName}
            >
              <SampleTestingMetaItem
                label="Tanggal Dibuat"
                value={formatDateTimeWib(item.createdAt)}
              />
              <SampleTestingMetaItem
                label="Terakhir Diperbarui"
                value={formatDateTimeWib(item.updatedAt)}
              />
            </RequestInformationCard>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            <SampleTestingDocumentsSection
              item={item}
              viewerRole="requester"
              onUploaded={() => setReloadKey((prev) => prev + 1)}
            />

            <SampleTestingSectionCard
              title="Detail Pengujian Sampel"
              subtitle="Ringkasan informasi sampel dan pengujian yang diajukan."
              icon={<FlaskConical className="h-5 w-5" />}
            >
              <SampleTestingMetaItem label="Nama Sampel" value={item.sampleName} />
              <SampleTestingMetaItem label="Jenis Sampel" value={item.sampleType} />
              <SampleTestingMetaItem label="Merek Sampel" value={item.sampleBrand} />
              <SampleTestingMetaItem label="Kemasan Sampel" value={item.samplePackaging} />
              <SampleTestingMetaItem label="Berat Sampel" value={item.sampleWeight} />
              <SampleTestingMetaItem label="Jumlah Sampel" value={item.sampleQuantity} />
              <SampleTestingMetaItem
                label="Cara Penyajian / Penanganan"
                value={item.sampleTestingServing}
              />
              <SampleTestingMetaItem
                label="Metode Pengujian"
                value={item.sampleTestingMethod}
              />
            <SampleTestingMetaItem
              label="Jenis Pengujian"
              value={item.sampleTestingType}
            />
          </SampleTestingSectionCard>
          </div>

          <div className="space-y-4">
            <SampleTestingSectionCard
              title="Informasi Pemohon"
              subtitle="Identitas pemohon dan informasi institusi yang dicantumkan saat pengajuan."
              icon={<UserRound className="h-5 w-5" />}
            >
              <SampleTestingMetaItem label="Nama Pemohon" value={item.name} />
              <SampleTestingMetaItem label="Institusi" value={item.institution} />
              <SampleTestingMetaItem
                label="Alamat Institusi"
                value={item.institutionAddress}
              />
              <SampleTestingMetaItem label="Email" value={item.email} />
              <SampleTestingMetaItem label="Nomor Telepon" value={item.phoneNumber} />
              <SampleTestingMetaItem
                label="Prodi Pemohon"
                value={item.requesterDepartment}
              />
            </SampleTestingSectionCard>

            <RequestInformationCard
              icon={<ClipboardList className="h-4 w-4" />}
              requesterName={item.name}
              requesterDepartment={item.requesterDepartment}
              status={item.status}
              onStatusClick={() => setProgressOpen(true)}
              approvedByName={item.approvedByName}
            >
              <SampleTestingMetaItem
                label="Tanggal Dibuat"
                value={formatDateTimeWib(item.createdAt)}
              />
              <SampleTestingMetaItem
                label="Terakhir Diperbarui"
                value={formatDateTimeWib(item.updatedAt)}
              />
            </RequestInformationCard>
          </div>
        </div>
      )}
      <RequestProgressDialog
        open={progressOpen}
        onOpenChange={setProgressOpen}
        title="Progress Pengujian Sampel"
        code={item.code}
        steps={getSampleTestingProgressFlow(item)}
      />
    </section>
  );
}
