"use client";

import { format } from "date-fns";
import { type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toWibIsoString } from "@/lib/date-time";

export type ScheduleCategory =
  | "Practicum"
  | "Maintenance"
  | "Agenda"
  | "Holiday"
  | "Block"
  | "Other";

export type ScheduleFormState = {
  title: string;
  description: string;
  category: ScheduleCategory;
  room: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export const SCHEDULE_CATEGORIES: ScheduleCategory[] = [
  "Practicum",
  "Maintenance",
  "Agenda",
  "Holiday",
  "Block",
  "Other",
];

function combineDateTime(date: Date | undefined, time: string) {
  if (!date || !time) return "";
  return `${format(date, "yyyy-MM-dd")}T${time}`;
}

function updateDatePart(value: string, date: Date | undefined) {
  if (!date) return "";
  return `${format(date, "yyyy-MM-dd")}T${getTimeFromDateTime(value) || "00:00"}`;
}

function updateTimePart(value: string, time: string) {
  const currentDate = getDateFromDateTime(value);
  if (!currentDate) return value;
  return combineDateTime(currentDate, time);
}

function getDateFromDateTime(value: string) {
  if (!value) return undefined;
  const [datePart] = value.split("T");
  if (!datePart) return undefined;
  const parsed = new Date(`${datePart}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function getTimeFromDateTime(value: string) {
  if (!value) return "";
  const [, timePart = ""] = value.split("T");
  return timePart.slice(0, 5);
}

function DateTimePickerField({
  id,
  label,
  value,
  onChange,
  disabled,
  minDate,
  minTime,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minDate?: Date;
  minTime?: string;
}) {
  const selectedDate = getDateFromDateTime(value);
  const selectedTime = getTimeFromDateTime(value);

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <DatePicker
          value={selectedDate}
          onChange={(nextDate) => onChange(updateDatePart(value, nextDate))}
          disabled={disabled}
          defaultMonth={selectedDate}
          calendarDisabled={
            minDate ? (calendarDate) => calendarDate < minDate : undefined
          }
          className="w-full sm:flex-1"
          buttonClassName="w-full"
        />
        <Input
          type="time"
          id={`${id}-time`}
          value={selectedTime}
          onChange={(event) => onChange(updateTimePart(value, event.target.value))}
          step="60"
          min={minTime}
          placeholder="HH:MM"
          className="h-11 border-slate-300 bg-white px-3 focus-visible:border-slate-500 focus-visible:ring-[3px] focus-visible:ring-slate-200 sm:w-36"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export function validateScheduleForm(
  form: ScheduleFormState,
  setError: (message: string) => void,
) {
  const title = form.title.trim();
  const description = form.description.trim();
  const startTime = form.startTime.trim();
  const endTime = form.endTime.trim();

  if (!title) {
    setError("Judul jadwal wajib diisi.");
    return null;
  }
  if (!startTime || !endTime) {
    setError("Waktu mulai dan waktu selesai wajib diisi.");
    return null;
  }
  if (new Date(toWibIsoString(startTime)) >= new Date(toWibIsoString(endTime))) {
    setError("Waktu selesai harus setelah waktu mulai.");
    return null;
  }

  return {
    title,
    description,
    category: form.category,
    room: form.room || null,
    start_time: toWibIsoString(startTime),
    end_time: toWibIsoString(endTime),
    is_active: form.isActive,
  };
}

export function formatDateTimeLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(date).replace(" ", "T");
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSubmit,
  rooms,
  title,
  description,
  error,
  isSubmitting,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ScheduleFormState;
  onChange: (field: keyof ScheduleFormState, value: string | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  rooms: Array<{ id: string; label: string }>;
  title: string;
  description: string;
  error: string;
  isSubmitting: boolean;
  trigger?: ReactNode;
}) {
  const startDate = getDateFromDateTime(form.startTime);
  const endDate = getDateFromDateTime(form.endTime);
  const startTime = getTimeFromDateTime(form.startTime);
  const minEndDate = startDate ? new Date(startDate) : undefined;
  if (minEndDate) minEndDate.setHours(0, 0, 0, 0);
  const minEndTime =
    startDate && endDate && format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")
      ? startTime || undefined
      : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-800">Judul Jadwal</span>
              <Input
                value={form.title}
                onChange={(event) => onChange("title", event.target.value)}
                placeholder="Contoh: Praktikum Kimia Dasar"
                className="h-11"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-800">Kategori</span>
              <select
                value={form.category}
                onChange={(event) => onChange("category", event.target.value as ScheduleCategory)}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {SCHEDULE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <DateTimePickerField
              id="schedule-start-time"
              label="Waktu Mulai (WIB)"
              value={form.startTime}
              onChange={(value) => onChange("startTime", value)}
              disabled={isSubmitting}
            />

            <DateTimePickerField
              id="schedule-end-time"
              label="Waktu Selesai (WIB)"
              value={form.endTime}
              onChange={(value) => onChange("endTime", value)}
              disabled={isSubmitting}
              minDate={minEndDate}
              minTime={minEndTime}
            />

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-800">Ruangan</span>
              <select
                value={form.room}
                onChange={(event) => onChange("room", event.target.value)}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Semua / Tidak spesifik</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-800">Deskripsi</span>
            <Textarea
              value={form.description}
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="Tambahkan detail jadwal, kelas, atau catatan lain."
              className="min-h-28 resize-y"
            />
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => onChange("isActive", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-sm text-slate-700">Jadwal aktif dan ditampilkan di kalender</span>
          </label>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="submit"
              className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
