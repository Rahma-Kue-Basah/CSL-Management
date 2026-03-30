"use client";

import { FlaskConical, NotebookPen, UserRound } from "lucide-react";

import type { PengujianRow } from "@/hooks/pengujians/use-pengujians";
import { formatDateTimeWib } from "@/lib/date-format";
import { getStatusBadgeClass, getStatusDisplayLabel } from "@/lib/status";

function hasDisplayValue(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim();
  return normalized !== "" && normalized !== "-";
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

function DetailItem({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value?: string | null;
  variant?: "default" | "status";
}) {
  const displayValue = hasDisplayValue(value) ? String(value).trim() : "-";
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

function DetailMetaItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!hasDisplayValue(value)) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-right text-xs leading-5 text-slate-800">{value}</p>
    </div>
  );
}

export default function SampleTestingDetailContent({
  item,
}: {
  item: PengujianRow;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-300">Detail Request</p>
            <h2 className="mt-1 text-xl font-bold text-slate-50">{item.code}</h2>
          </div>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(item.status)}`}
          >
            {getStatusDisplayLabel(item.status)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <DetailCard
            title="Detail Pengujian Sampel"
            subtitle="Ringkasan informasi sampel dan pengujian yang diajukan."
            icon={<FlaskConical className="h-5 w-5" />}
          >
            <DetailItem label="Nama Sampel" value={item.sampleName} />
            <DetailItem label="Jenis Sampel" value={item.sampleType} />
            <DetailItem label="Merek Sampel" value={item.sampleBrand} />
            <DetailItem label="Kemasan Sampel" value={item.samplePackaging} />
            <DetailItem label="Berat Sampel" value={item.sampleWeight} />
            <DetailItem label="Jumlah Sampel" value={item.sampleQuantity} />
            <DetailItem label="Serving" value={item.sampleTestingServing} />
            <DetailItem label="Metode Uji" value={item.sampleTestingMethod} />
            <DetailItem label="Jenis Pengujian" value={item.sampleTestingType} />
          </DetailCard>

          <DetailCard
            title="Informasi Permohonan"
            subtitle="Informasi pemohon, institusi, dan status permohonan saat ini."
            icon={<NotebookPen className="h-5 w-5" />}
          >
            <DetailItem label="Institusi" value={item.institution} />
            <DetailItem label="Alamat Institusi" value={item.institutionAddress} />
            <DetailItem label="Status" value={item.status} variant="status" />
            <DetailMetaItem label="Tanggal Dibuat" value={formatDateTimeWib(item.createdAt)} />
            <DetailMetaItem label="Terakhir Diperbarui" value={formatDateTimeWib(item.updatedAt)} />
            <DetailMetaItem label="Disetujui Oleh" value={item.approvedByName} />
          </DetailCard>
        </div>

        <div className="space-y-6">
          <DetailCard
            title="Informasi Pemohon"
            subtitle="Identitas pemohon yang mengajukan pengujian sampel."
            icon={<UserRound className="h-5 w-5" />}
          >
            <DetailItem label="Nama Pemohon" value={item.name} />
            <DetailItem label="Email" value={item.email} />
            <DetailItem label="Nomor Telepon" value={item.phoneNumber} />
            <DetailItem label="Prodi Pemohon" value={item.requesterDepartment} />
          </DetailCard>
        </div>
      </div>
    </div>
  );
}
