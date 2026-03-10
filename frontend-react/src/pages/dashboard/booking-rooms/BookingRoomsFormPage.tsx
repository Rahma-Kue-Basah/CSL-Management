"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateBookingRoom } from "@/hooks/bookings/use-create-booking-room";
import { useEquipmentOptions } from "@/hooks/equipments/use-equipment-options";
import { useRoomOptions } from "@/hooks/rooms/use-room-options";

type FormData = {
  roomId: string;
  purpose: string;
  startTime: string;
  endTime: string;
  note: string;
  equipmentId: string;
  quantityEquipment: string;
};

const PURPOSE_OPTIONS = [
  { value: "Class", label: "Class" },
  { value: "Lab Work", label: "Lab Work" },
  { value: "Research", label: "Research" },
  { value: "Other", label: "Other" },
];

const initialFormData: FormData = {
  roomId: "",
  purpose: "Other",
  startTime: "",
  endTime: "",
  note: "",
  equipmentId: "",
  quantityEquipment: "",
};

function toApiDateTime(value: string) {
  if (!value) return "";
  return `${value}:00`;
}

function formatDateTime(value: string) {
  if (!value) return "-";
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  const displayValue = value?.trim() ? value : "-";
  const isEmpty = displayValue === "-";

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className={`mt-1.5 text-sm ${isEmpty ? "italic text-slate-400" : "font-medium text-slate-800"}`}>
        {displayValue}
      </p>
    </div>
  );
}

export default function BookingRoomsFormPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const { rooms, isLoading: isLoadingRooms, error: roomError } = useRoomOptions();
  const {
    equipments: equipmentOptions,
    isLoading: isLoadingEquipments,
    error: equipmentError,
  } = useEquipmentOptions();
  const { createBookingRoom, isSubmitting, errorMessage, setErrorMessage } =
    useCreateBookingRoom();

  const selectedRoomLabel = useMemo(
    () => rooms.find((room) => room.id === formData.roomId)?.label ?? "-",
    [rooms, formData.roomId],
  );
  const selectedEquipmentLabel = useMemo(
    () => equipmentOptions.find((equipment) => equipment.id === formData.equipmentId)?.label ?? "-",
    [equipmentOptions, formData.equipmentId],
  );

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const validateForm = () => {
    setValidationMessage("");
    setErrorMessage("");

    if (!formData.roomId) {
      setValidationMessage("Ruangan wajib dipilih.");
      return false;
    }
    if (!formData.purpose.trim()) {
      setValidationMessage("Tujuan penggunaan ruangan wajib diisi.");
      return false;
    }
    if (!PURPOSE_OPTIONS.some((option) => option.value === formData.purpose)) {
      setValidationMessage("Pilihan tujuan tidak valid.");
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      setValidationMessage("Waktu mulai dan waktu selesai wajib diisi.");
      return false;
    }
    if (formData.quantityEquipment) {
      const qty = Number(formData.quantityEquipment);
      if (!Number.isInteger(qty) || qty <= 0) {
        setValidationMessage("Jumlah peralatan harus berupa angka bulat lebih dari 0.");
        return false;
      }
    }
    if (formData.quantityEquipment && !formData.equipmentId) {
      setValidationMessage("Pilih peralatan terlebih dahulu sebelum mengisi jumlah.");
      return false;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      setValidationMessage("Rentang waktu tidak valid. Pastikan selesai lebih besar dari mulai.");
      return false;
    }
    return true;
  };

  const handleOpenConfirmation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    const result = await createBookingRoom({
      roomId: formData.roomId,
      purpose: formData.purpose,
      startTime: toApiDateTime(formData.startTime),
      endTime: toApiDateTime(formData.endTime),
      note: formData.note,
      equipmentId: formData.equipmentId || undefined,
      quantityEquipment: formData.quantityEquipment
        ? Number(formData.quantityEquipment)
        : undefined,
    });

    if (result.ok) {
      toast.success("Pengajuan booking ruangan berhasil dikirim.");
      setFormData(initialFormData);
      setIsConfirmOpen(false);
    } else if (result.message) {
      toast.error(result.message);
    }
  };

  return (
    <section className="space-y-4">
      <form
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-5"
        onSubmit={handleOpenConfirmation}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Ruangan
            </label>
            <select
              name="roomId"
              value={formData.roomId}
              onChange={handleChange}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm outline-none shadow-xs focus-visible:border-slate-500 focus-visible:ring-[3px] focus-visible:ring-slate-200"
              disabled={isLoadingRooms || isSubmitting}
            >
              <option value="">Pilih ruangan</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Tujuan
            </label>
            <select
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm outline-none shadow-xs focus-visible:border-slate-500 focus-visible:ring-[3px] focus-visible:ring-slate-200"
              disabled={isSubmitting}
            >
              {PURPOSE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Waktu Mulai
            </label>
            <Input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="border-slate-300 focus-visible:border-slate-500 focus-visible:ring-slate-200"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Waktu Selesai
            </label>
            <Input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              min={formData.startTime || undefined}
              className="border-slate-300 focus-visible:border-slate-500 focus-visible:ring-slate-200"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Peralatan (Opsional)
            </label>
            <select
              name="equipmentId"
              value={formData.equipmentId}
              onChange={handleChange}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm outline-none shadow-xs focus-visible:border-slate-500 focus-visible:ring-[3px] focus-visible:ring-slate-200"
              disabled={isSubmitting || isLoadingEquipments}
            >
              <option value="">Tanpa peralatan</option>
              {equipmentOptions.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Jumlah Peralatan (Opsional)
            </label>
            <Input
              type="number"
              min={1}
              step={1}
              name="quantityEquipment"
              value={formData.quantityEquipment}
              onChange={handleChange}
              placeholder="Contoh: 1"
              className="border-slate-300 focus-visible:border-slate-500 focus-visible:ring-slate-200"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Catatan
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows={4}
            maxLength={2000}
            placeholder="Tambahkan catatan jika diperlukan"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none shadow-xs focus-visible:border-slate-500 focus-visible:ring-[3px] focus-visible:ring-slate-200"
            disabled={isSubmitting}
          />
        </div>

        {validationMessage ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {validationMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || isLoadingRooms}>
            Ajukan Booking
          </Button>
        </div>
      </form>

      {roomError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {roomError}
        </div>
      ) : null}
      {equipmentError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {equipmentError}
        </div>
      ) : null}

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>Ringkasan Pengajuan</AlertDialogTitle>
            <AlertDialogDescription>
              Pastikan data berikut sudah sesuai sebelum pengajuan dikirim.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
            <SummaryItem label="Ruangan" value={selectedRoomLabel} />
            <SummaryItem label="Tujuan" value={formData.purpose} />
            <SummaryItem label="Waktu Mulai" value={formatDateTime(formData.startTime)} />
            <SummaryItem label="Waktu Selesai" value={formatDateTime(formData.endTime)} />
            <SummaryItem label="Peralatan" value={selectedEquipmentLabel} />
            <SummaryItem label="Jumlah Peralatan" value={formData.quantityEquipment} />
            <div className="sm:col-span-2">
              <SummaryItem label="Catatan" value={formData.note} />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Kembali</AlertDialogCancel>
            <AlertDialogAction disabled={isSubmitting} onClick={() => void handleConfirmSubmit()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Konfirmasi Ajukan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
