"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePickerTime } from "@/components/ui/date-picker-time";
import { PURPOSE_OPTIONS } from "@/constants/purposes";
import { API_BOOKING_DETAIL } from "@/constants/api";
import { useRoomOptions } from "@/hooks/use-room-options";
import { useEquipmentOptions } from "@/hooks/use-equipment-options";
import { useBookingActions } from "@/hooks/use-booking-actions";
import { authFetch } from "@/lib/auth-fetch";

const INITIAL_FORM = {
  roomId: "",
  equipmentId: "",
  quantityEquipment: "",
  startDate: null,
  startTime: "",
  endDate: null,
  endTime: "",
  purpose: "other",
  note: "",
};

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toTime = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export function BookingForm({ bookingId }) {
  const router = useRouter();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState("");
  const { rooms, isLoading: isLoadingRooms, error: roomError } =
    useRoomOptions();
  const {
    equipments,
    isLoading: isLoadingEquipments,
    error: equipmentError,
  } = useEquipmentOptions();
  const {
    createBooking,
    updateBooking,
    isSubmitting,
    errorMessage: submitError,
    setErrorMessage: setSubmitError,
  } = useBookingActions();

  useEffect(() => {
    const loadDetail = async () => {
      if (!bookingId) return;
      setErrorMessage("");
      try {
        const resp = await authFetch(API_BOOKING_DETAIL(bookingId));
        if (!resp.ok) throw new Error("Gagal memuat data booking.");
        const data = await resp.json();
        setFormData({
          roomId: data.room || "",
          equipmentId: data.equipment || "",
          quantityEquipment: data.quantity_equipment?.toString() || "",
          startDate: toDate(data.start_time),
          startTime: toTime(data.start_time),
          endDate: toDate(data.end_time),
          endTime: toTime(data.end_time),
          purpose: data.purpose || "other",
          note: data.note || "",
        });
      } catch (error) {
        setErrorMessage(error.message || "Terjadi kesalahan.");
      }
    };

    loadDetail();
  }, [bookingId]);

  useEffect(() => {
    if (submitError) setErrorMessage(submitError);
  }, [submitError]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const helperText = useMemo(
    () =>
      bookingId
        ? "Perbarui data booking ruangan sesuai kebutuhan."
        : "Ajukan booking ruangan untuk jadwal penggunaan lab.",
    [bookingId],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSubmitError("");

    if (!formData.roomId) {
      setErrorMessage("Ruangan wajib dipilih.");
      return;
    }
    if (!formData.startDate || !formData.startTime) {
      setErrorMessage("Tanggal dan jam mulai wajib diisi.");
      return;
    }
    if (!formData.endDate || !formData.endTime) {
      setErrorMessage("Tanggal dan jam selesai wajib diisi.");
      return;
    }
    if (
      formData.equipmentId &&
      (!formData.quantityEquipment || Number(formData.quantityEquipment) <= 0)
    ) {
      setErrorMessage("Jumlah equipment wajib diisi jika memilih equipment.");
      return;
    }

    const result = bookingId
      ? await updateBooking(bookingId, formData)
      : await createBooking(formData);

    if (result.ok) {
      router.push("/my-bookings-request");
    }
  };

  return (
    <section className="space-y-4">
      <div className="mx-auto text-center">
        <p className="text-sm text-muted-foreground">{helperText}</p>
      </div>

      <div className="rounded-lg">
        <form
          className="mx-auto w-full max-w-xl space-y-4 rounded-lg border bg-card p-4 md:max-w-[55%]"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Ruangan</label>
              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                disabled={isLoadingRooms}
                required
              >
                <option value="">
                  {isLoadingRooms ? "Memuat ruangan..." : "Pilih ruangan"}
                </option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.label}
                  </option>
                ))}
              </select>
              {roomError ? (
                <p className="text-xs text-destructive">{roomError}</p>
              ) : null}
            </div>

            <div className="space-y-1 md:col-span-2">
              <DatePickerTime
                dateLabel="Tanggal Mulai"
                timeLabel="Jam Mulai"
                date={formData.startDate}
                onDateChange={(date) =>
                  setFormData((prev) => ({ ...prev, startDate: date }))
                }
                time={formData.startTime}
                onTimeChange={(value) =>
                  setFormData((prev) => ({ ...prev, startTime: value }))
                }
                dateId="booking-start-date"
                timeId="booking-start-time"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <DatePickerTime
                dateLabel="Tanggal Selesai"
                timeLabel="Jam Selesai"
                date={formData.endDate}
                onDateChange={(date) =>
                  setFormData((prev) => ({ ...prev, endDate: date }))
                }
                time={formData.endTime}
                onTimeChange={(value) =>
                  setFormData((prev) => ({ ...prev, endTime: value }))
                }
                dateId="booking-end-date"
                timeId="booking-end-time"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Equipment (Opsional)</label>
              <select
                name="equipmentId"
                value={formData.equipmentId}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                disabled={isLoadingEquipments}
              >
                <option value="">
                  {isLoadingEquipments
                    ? "Memuat equipment..."
                    : "Pilih equipment"}
                </option>
                {equipments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {equipmentError ? (
                <p className="text-xs text-destructive">{equipmentError}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Jumlah Equipment</label>
              <input
                type="number"
                name="quantityEquipment"
                value={formData.quantityEquipment}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                min="1"
                placeholder="1"
                disabled={!formData.equipmentId}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Tujuan</label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {PURPOSE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium">Catatan</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Tambahkan catatan (opsional)"
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting
                ? "Menyimpan..."
                : bookingId
                  ? "Perbarui Booking"
                  : "Simpan Booking"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default BookingForm;
