"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { useCreateBookingRoom } from "@/hooks/bookings/use-create-booking-room";
import { useEquipmentOptions } from "@/hooks/equipments/use-equipment-options";
import { useRoomOptions } from "@/hooks/rooms/use-room-options";
import { formatLocalDateTimeAsWib, toWibIsoString } from "@/lib/date-time";
import { cn } from "@/lib/utils";

type FormData = {
  roomId: string;
  purpose: string;
  startTime: string;
  endTime: string;
  attendeeCount: string;
  attendeeNames: string;
  note: string;
  equipmentItems: Array<{
    equipmentId: string;
    quantity: string;
  }>;
};

type SelectOption = {
  value: string;
  label: string;
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
  attendeeCount: "1",
  attendeeNames: "",
  note: "",
  equipmentItems: [],
};

function combineDateTime(date: Date | undefined, time: string) {
  if (!date || !time) return "";
  return `${format(date, "yyyy-MM-dd")}T${time}`;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  const displayValue = value?.trim() ? value : "-";
  const isEmpty = displayValue === "-";

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-sm ${isEmpty ? "italic text-slate-400" : "font-medium text-slate-800"}`}
      >
        {displayValue}
      </p>
    </div>
  );
}

type ComboboxFieldProps = {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  emptyText: string;
  disabled?: boolean;
  required?: boolean;
  showClear?: boolean;
  onChange: (value: string) => void;
};

function ComboboxField({
  label,
  value,
  options,
  placeholder,
  emptyText,
  disabled,
  required,
  showClear = false,
  onChange,
}: ComboboxFieldProps) {
  const [query, setQuery] = useState("");
  const selectedOption =
    options.find((option) => option.value === value) ?? null;
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-600">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <Combobox<SelectOption>
        items={filteredOptions}
        value={selectedOption}
        itemToStringLabel={(item) => item.label}
        itemToStringValue={(item) => item.value}
        onInputValueChange={(inputValue) => setQuery(inputValue)}
        onValueChange={(nextValue) => {
          onChange(nextValue?.value ?? "");
          setQuery("");
        }}
      >
        <ComboboxInput
          disabled={disabled}
          placeholder={placeholder}
          showClear={showClear}
          className="h-11 w-full rounded-md border-slate-300 bg-white shadow-xs [&_[data-slot=input-group-control]]:h-11 [&_[data-slot=input-group-control]]:px-3 [&_[data-slot=input-group-control]]:text-sm"
        />
        <ComboboxContent className="border border-slate-200 bg-white">
          <ComboboxList>
            <ComboboxEmpty>{emptyText}</ComboboxEmpty>
            {filteredOptions.map((option, index) => (
              <ComboboxItem key={option.value} value={option} index={index}>
                {option.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

type DateTimePickerFieldProps = {
  id: string;
  label: string;
  date: Date | undefined;
  time: string;
  disabled?: boolean;
  minDate?: Date;
  minTime?: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
};

function DateTimePickerField({
  id,
  label,
  date,
  time,
  disabled,
  minDate,
  minTime,
  onDateChange,
  onTimeChange,
}: DateTimePickerFieldProps) {
  return (
    <div className="w-full space-y-1.5">
      <label
        htmlFor={`${id}-time`}
        className="text-xs font-medium text-slate-600"
      >
        {label} <span className="text-rose-600">*</span>
      </label>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <DatePicker
          value={date}
          onChange={onDateChange}
          disabled={disabled}
          defaultMonth={date}
          calendarDisabled={
            minDate ? (calendarDate) => calendarDate < minDate : undefined
          }
          className="w-full sm:flex-1"
          buttonClassName={cn("w-full", !date && "text-slate-400")}
        />
        <Input
          type="time"
          id={`${id}-time`}
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
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

export default function BookingRoomsFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const {
    rooms,
    isLoading: isLoadingRooms,
    error: roomError,
  } = useRoomOptions();
  const {
    equipments: equipmentOptions,
    isLoading: isLoadingEquipments,
    error: equipmentError,
  } = useEquipmentOptions("", formData.roomId, Boolean(formData.roomId));
  const { createBookingRoom, isSubmitting, errorMessage, setErrorMessage } =
    useCreateBookingRoom();

  const minEndDate = startDate ? new Date(startDate) : undefined;
  if (minEndDate) {
    minEndDate.setHours(0, 0, 0, 0);
  }
  const minEndTime =
    startDate &&
    endDate &&
    format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")
      ? startTime || undefined
      : undefined;

  const selectedRoomLabel = useMemo(
    () => rooms.find((room) => room.id === formData.roomId)?.label ?? "-",
    [rooms, formData.roomId],
  );
  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === formData.roomId) ?? null,
    [rooms, formData.roomId],
  );
  const selectedEquipmentLabel = useMemo(
    () =>
      formData.equipmentItems.length
        ? formData.equipmentItems
            .map((item) => {
              const label =
                equipmentOptions.find(
                  (equipment) => equipment.id === item.equipmentId,
                )?.label ?? "-";
              return item.quantity ? `${label} (${item.quantity})` : label;
            })
            .join(", ")
        : "-",
    [equipmentOptions, formData.equipmentItems],
  );
  const roomOptions = useMemo<SelectOption[]>(
    () => rooms.map((room) => ({ value: room.id, label: room.label })),
    [rooms],
  );
  const equipmentComboboxOptions = useMemo<SelectOption[]>(
    () =>
      equipmentOptions.map((equipment) => ({
        value: equipment.id,
        label: `${equipment.label} (stok: ${equipment.quantity})`,
      })),
    [equipmentOptions],
  );

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setFormData((prev) => ({
      ...prev,
      startTime: combineDateTime(date, startTime),
    }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    setFormData((prev) => ({
      ...prev,
      startTime: combineDateTime(startDate, time),
    }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    setFormData((prev) => ({
      ...prev,
      endTime: combineDateTime(date, endTime),
    }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const handleEndTimeChange = (time: string) => {
    setEndTime(time);
    setFormData((prev) => ({
      ...prev,
      endTime: combineDateTime(endDate, time),
    }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const handleSelectChange = (name: "roomId" | "purpose", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "roomId" ? { equipmentItems: [] } : {}),
    }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const handleEquipmentItemChange = (
    index: number,
    field: "equipmentId" | "quantity",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      equipmentItems: prev.equipmentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const handleAddEquipmentItem = () => {
    setFormData((prev) => ({
      ...prev,
      equipmentItems: [
        ...prev.equipmentItems,
        { equipmentId: "", quantity: "" },
      ],
    }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const handleRemoveEquipmentItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      equipmentItems: prev.equipmentItems.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
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
    const attendeeCount = Number(formData.attendeeCount);
    if (!Number.isInteger(attendeeCount) || attendeeCount <= 0) {
      setValidationMessage(
        "Jumlah orang harus berupa angka bulat lebih dari 0.",
      );
      return false;
    }
    if (selectedRoom && attendeeCount > selectedRoom.capacity) {
      setValidationMessage(
        `Jumlah orang tidak boleh melebihi kapasitas ruangan (${selectedRoom.capacity} orang).`,
      );
      return false;
    }
    const selectedEquipmentIds = new Set<string>();
    for (const item of formData.equipmentItems) {
      const hasEquipment = item.equipmentId.trim().length > 0;
      const hasQuantity = item.quantity.trim().length > 0;

      if (!hasEquipment && !hasQuantity) {
        setValidationMessage(
          "Hapus baris alat yang kosong atau lengkapi datanya.",
        );
        return false;
      }
      if (!hasEquipment || !hasQuantity) {
        setValidationMessage(
          "Setiap alat harus memiliki pilihan alat dan jumlah.",
        );
        return false;
      }

      const qty = Number(item.quantity);
      const selectedEquipment = equipmentOptions.find(
        (equipment) => equipment.id === item.equipmentId,
      );
      if (!Number.isInteger(qty) || qty <= 0) {
        setValidationMessage(
          "Jumlah setiap alat harus berupa angka bulat lebih dari 0.",
        );
        return false;
      }
      if (selectedEquipment && qty > selectedEquipment.quantity) {
        setValidationMessage(
          `Jumlah ${selectedEquipment.label} melebihi stok tersedia (${selectedEquipment.quantity}).`,
        );
        return false;
      }
      if (selectedEquipmentIds.has(item.equipmentId)) {
        setValidationMessage(
          "Peralatan yang sama tidak boleh dipilih lebih dari sekali.",
        );
        return false;
      }
      selectedEquipmentIds.add(item.equipmentId);
    }

    const start = new Date(toWibIsoString(formData.startTime));
    const end = new Date(toWibIsoString(formData.endTime));
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start >= end
    ) {
      setValidationMessage(
        "Rentang waktu tidak valid. Pastikan selesai lebih besar dari mulai.",
      );
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
      startTime: toWibIsoString(formData.startTime),
      endTime: toWibIsoString(formData.endTime),
      attendeeCount: Number(formData.attendeeCount),
      attendeeNames: formData.attendeeNames,
      note: formData.note,
      equipmentItems: formData.equipmentItems.map((item) => ({
        equipmentId: item.equipmentId,
        quantity: Number(item.quantity),
      })),
    });

    if (result.ok) {
      toast.success("Pengajuan booking ruangan berhasil dikirim.");
      setFormData(initialFormData);
      setStartDate(undefined);
      setStartTime("");
      setEndDate(undefined);
      setEndTime("");
      setIsConfirmOpen(false);
      router.push("/booking-rooms");
    } else if (result.message) {
      toast.error(result.message);
    }
  };

  return (
    <section className="space-y-4">
      <form
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(15,23,42,0.05)]"
        onSubmit={handleOpenConfirmation}
      >
        <div className="border-b border-slate-200 pb-4">
          <p className="text-base font-semibold text-slate-900">
            Form Booking Ruangan
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ComboboxField
            label="Ruangan"
            value={formData.roomId}
            options={roomOptions}
            placeholder="Pilih ruangan"
            emptyText="Ruangan tidak ditemukan."
            disabled={isLoadingRooms || isSubmitting}
            required
            onChange={(value) => handleSelectChange("roomId", value)}
          />

          <ComboboxField
            label="Tujuan"
            value={formData.purpose}
            options={PURPOSE_OPTIONS}
            placeholder="Pilih tujuan"
            emptyText="Tujuan tidak ditemukan."
            disabled={isSubmitting}
            required
            onChange={(value) => handleSelectChange("purpose", value)}
          />

          <div className="grid gap-5 md:col-span-2 md:grid-cols-2">
            <DateTimePickerField
              id="start-time"
              label="Waktu Mulai (WIB)"
              date={startDate}
              time={startTime}
              onDateChange={handleStartDateChange}
              onTimeChange={handleStartTimeChange}
              disabled={isSubmitting}
            />

            <DateTimePickerField
              id="end-time"
              label="Waktu Selesai (WIB)"
              date={endDate}
              time={endTime}
              minDate={minEndDate}
              minTime={minEndTime}
              onDateChange={handleEndDateChange}
              onTimeChange={handleEndTimeChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              Jumlah Orang <span className="text-rose-600">*</span>
            </label>
            <Input
              type="number"
              min={1}
              step={1}
              name="attendeeCount"
              value={formData.attendeeCount}
              onChange={handleChange}
              placeholder="Contoh: 10"
              className="h-11 border-slate-300 bg-white px-3 focus-visible:border-slate-500 focus-visible:ring-slate-200"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              Nama Orang
            </label>
            <Input
              type="text"
              name="attendeeNames"
              value={formData.attendeeNames}
              onChange={handleChange}
              placeholder="Contoh: Andi, Budi, Citra"
              className="h-11 border-slate-300 bg-white px-3 focus-visible:border-slate-500 focus-visible:ring-slate-200"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Peralatan (Opsional)
                </label>
                <p className="text-[11px] text-slate-500">
                  Tambahkan satu atau lebih alat beserta jumlahnya.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEquipmentItem}
                disabled={isSubmitting || isLoadingEquipments}
              >
                <Plus className="h-4 w-4" />
                Tambah Alat
              </Button>
            </div>

            {formData.equipmentItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Belum ada alat yang ditambahkan.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.equipmentItems.map((item, index) => (
                  <div
                    key={`${index}-${item.equipmentId}`}
                    className="grid grid-cols-1 gap-3 border-b border-slate-200 pb-4 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_180px_44px] md:items-start"
                  >
                    <ComboboxField
                      label={`Alat ${index + 1}`}
                      value={item.equipmentId}
                      options={equipmentComboboxOptions}
                      placeholder={
                        formData.roomId
                          ? "Pilih peralatan"
                          : "Pilih ruangan terlebih dahulu"
                      }
                      emptyText={
                        formData.roomId
                          ? "Peralatan tidak ditemukan."
                          : "Pilih ruangan terlebih dahulu."
                      }
                      disabled={isSubmitting || isLoadingEquipments}
                      showClear
                      onChange={(value) =>
                        handleEquipmentItemChange(index, "equipmentId", value)
                      }
                    />
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600">
                        Jumlah
                      </label>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantity}
                        onChange={(event) =>
                          handleEquipmentItemChange(
                            index,
                            "quantity",
                            event.target.value,
                          )
                        }
                        placeholder="Contoh: 1"
                        className="h-11 border-slate-300 bg-white px-3 focus-visible:border-slate-500 focus-visible:ring-slate-200"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="block text-xs font-medium opacity-0">
                        Hapus
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveEquipmentItem(index)}
                        disabled={isSubmitting}
                        className="h-11 w-11 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">Catatan</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows={4}
            maxLength={2000}
            placeholder="Tambahkan catatan jika diperlukan"
            className="min-h-[120px] w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm outline-none shadow-xs focus-visible:border-slate-500 focus-visible:ring-[3px] focus-visible:ring-slate-200"
            disabled={isSubmitting}
          />
          <p className="text-[11px] text-slate-500">Maksimal 2000 karakter.</p>
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

        <div className="flex justify-end border-t border-slate-200 pt-3">
          <Button
            type="submit"
            className="min-w-[180px]"
            disabled={isSubmitting || isLoadingRooms}
          >
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
        <AlertDialogContent className="max-w-xl border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>Konfirmasi Pengajuan</AlertDialogTitle>
            <AlertDialogDescription>
              Periksa kembali data booking ruangan sebelum pengajuan dikirim.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <SummaryItem label="Ruangan" value={selectedRoomLabel} />
            <SummaryItem label="Tujuan" value={formData.purpose} />
            <SummaryItem
              label="Waktu Mulai (WIB)"
              value={formatLocalDateTimeAsWib(formData.startTime)}
            />
            <SummaryItem
              label="Waktu Selesai (WIB)"
              value={formatLocalDateTimeAsWib(formData.endTime)}
            />
            <SummaryItem label="Jumlah Orang" value={formData.attendeeCount} />
            <SummaryItem label="Nama Orang" value={formData.attendeeNames} />
            <SummaryItem label="Peralatan" value={selectedEquipmentLabel} />
            <SummaryItem label="Catatan" value={formData.note} />
          </div>

          <AlertDialogFooter className="border-t border-slate-200 pt-4">
            <AlertDialogCancel
              disabled={isSubmitting}
              className="rounded-md border-slate-300"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={() => void handleConfirmSubmit()}
              className="rounded-md bg-[#0052C7] text-white hover:bg-[#0048B4]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Konfirmasi"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
