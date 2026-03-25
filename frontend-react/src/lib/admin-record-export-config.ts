"use client";

import type { BookingRow } from "@/hooks/bookings/use-bookings";
import type { UseRow } from "@/hooks/uses/use-uses";
import type { BorrowRow } from "@/hooks/borrows/use-borrows";
import type { PengujianRow } from "@/hooks/pengujians/use-pengujians";
import { getStatusDisplayLabel } from "@/lib/status";

export type ExportColumn<TRow> = {
  header: string;
  cell: (row: TRow) => string;
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

export const BOOKING_EXPORT_COLUMNS: ExportColumn<BookingRow>[] = [
  { header: "Kode", cell: (booking) => booking.code },
  { header: "Status", cell: (booking) => getStatusDisplayLabel(booking.status) },
  { header: "Ruangan", cell: (booking) => booking.roomName },
  { header: "No. Ruangan", cell: (booking) => booking.roomNumber },
  { header: "Peminjam", cell: (booking) => booking.requesterName },
  { header: "Email Peminjam", cell: (booking) => booking.requesterEmail },
  { header: "Jumlah Orang", cell: (booking) => booking.attendeeCount },
  { header: "Nama Orang", cell: (booking) => booking.attendeeNames || "-" },
  { header: "Peralatan", cell: (booking) => booking.equipmentName },
  { header: "Keperluan", cell: (booking) => booking.purpose },
  { header: "Waktu Mulai", cell: (booking) => formatDateTime(booking.startTime) },
  { header: "Waktu Selesai", cell: (booking) => formatDateTime(booking.endTime) },
  { header: "Disetujui Oleh", cell: (booking) => booking.approvedByName || "-" },
  { header: "Catatan", cell: (booking) => booking.note || "-" },
  { header: "Dibuat", cell: (booking) => formatDateTime(booking.createdAt) },
];

export const USE_EXPORT_COLUMNS: ExportColumn<UseRow>[] = [
  { header: "Kode", cell: (item) => item.code },
  { header: "Status", cell: (item) => getStatusDisplayLabel(item.status) },
  { header: "Alat", cell: (item) => item.equipmentName },
  { header: "Ruangan", cell: (item) => item.roomName },
  { header: "Pengguna", cell: (item) => item.requesterName },
  { header: "Jumlah", cell: (item) => item.quantity },
  { header: "Keperluan", cell: (item) => item.purpose },
  { header: "Waktu Mulai", cell: (item) => formatDateTime(item.startTime) },
  { header: "Waktu Selesai", cell: (item) => formatDateTime(item.endTime) },
  { header: "Disetujui Oleh", cell: (item) => item.approvedByName || "-" },
  { header: "Catatan", cell: (item) => item.note || "-" },
  { header: "Dibuat", cell: (item) => formatDateTime(item.createdAt) },
];

export const BORROW_EXPORT_COLUMNS: ExportColumn<BorrowRow>[] = [
  { header: "Kode", cell: (item) => item.code },
  { header: "Status", cell: (item) => getStatusDisplayLabel(item.status) },
  { header: "Alat", cell: (item) => item.equipmentName },
  { header: "Peminjam", cell: (item) => item.requesterName },
  { header: "Jumlah", cell: (item) => item.quantity },
  { header: "Keperluan", cell: (item) => item.purpose },
  { header: "Waktu Mulai", cell: (item) => formatDateTime(item.startTime) },
  { header: "Waktu Selesai", cell: (item) => formatDateTime(item.endTime) },
  { header: "Waktu Kembali Aktual", cell: (item) => formatDateTime(item.endTimeActual) },
  { header: "Disetujui Oleh", cell: (item) => item.approvedByName || "-" },
  { header: "Catatan", cell: (item) => item.note || "-" },
  { header: "Dibuat", cell: (item) => formatDateTime(item.createdAt) },
];

export const PENGUJIAN_EXPORT_COLUMNS: ExportColumn<PengujianRow>[] = [
  { header: "Kode", cell: (item) => item.code },
  { header: "Status", cell: (item) => getStatusDisplayLabel(item.status) },
  { header: "Pemohon", cell: (item) => item.name },
  { header: "Institusi", cell: (item) => item.institution },
  { header: "Email", cell: (item) => item.email },
  { header: "No. Telepon", cell: (item) => item.phoneNumber },
  { header: "Nama Sampel", cell: (item) => item.sampleName },
  { header: "Jenis Sampel", cell: (item) => item.sampleType },
  { header: "Merk Sampel", cell: (item) => item.sampleBrand },
  { header: "Kemasan Sampel", cell: (item) => item.samplePackaging },
  { header: "Berat Sampel", cell: (item) => item.sampleWeight },
  { header: "Jumlah Sampel", cell: (item) => item.sampleQuantity },
  { header: "Layanan Uji", cell: (item) => item.sampleTestingServing },
  { header: "Metode Uji", cell: (item) => item.sampleTestingMethod },
  { header: "Tipe Uji", cell: (item) => item.sampleTestingType },
  { header: "Disetujui Oleh", cell: (item) => item.approvedByName || "-" },
  { header: "Dibuat", cell: (item) => formatDateTime(item.createdAt) },
];
