"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
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
import { useEquipmentOptions } from "@/hooks/equipments/use-equipment-options";
import { useCreateUse } from "@/hooks/uses/use-create-use";
import { formatLocalDateTimeAsWib, toWibIsoString } from "@/lib/date-time";
import { cn } from "@/lib/utils";

type FormData = {
  equipmentId: string;
  quantity: string;
  purpose: string;
  startTime: string;
  endTime: string;
  note: string;
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
  equipmentId: "",
  quantity: "1",
  purpose: "Other",
  startTime: "",
  endTime: "",
  note: "",
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
  onChange,
}: ComboboxFieldProps) {
  const [query, setQuery] = useState("");
  const selectedOption = options.find((option) => option.value === value) ?? null;
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
  required?: boolean;
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
  required = true,
  minDate,
  minTime,
  onDateChange,
  onTimeChange,
}: DateTimePickerFieldProps) {
  return (
    <div className="w-full space-y-1.5">
      <label htmlFor={`${id}-time`} className="text-xs font-medium text-slate-600">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <DatePicker
          value={date}
          onChange={onDateChange}
          disabled={disabled}
          defaultMonth={date}
          clearable={!required}
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

export default function UseEquipmentFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const {
    equipments,
    isLoading: isLoadingEquipments,
    error: equipmentError,
  } = useEquipmentOptions("available");
  const { createUse, isSubmitting, errorMessage, setErrorMessage } = useCreateUse();

  const minEndDate = startDate ? new Date(startDate) : undefined;
  if (minEndDate) {
    minEndDate.setHours(0, 0, 0, 0);
  }
  const minEndTime =
    startDate && endDate && format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")
      ? startTime || undefined
      : undefined;

  const selectedEquipmentLabel = useMemo(
    () => equipments.find((equipment) => equipment.id === formData.equipmentId)?.label ?? "-",
    [equipments, formData.equipmentId],
  );
  const equipmentOptions = useMemo<SelectOption[]>(
    () =>
      equipments.map((equipment) => ({
        value: equipment.id,
        label: equipment.label,
      })),
    [equipments],
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

  const handleSelectChange = (name: "equipmentId" | "purpose", value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const validateForm = () => {
    setValidationMessage("");
    setErrorMessage("");

    if (!formData.equipmentId) {
      setValidationMessage("Alat wajib dipilih.");
      return false;
    }
    if (!formData.purpose.trim()) {
      setValidationMessage("Tujuan penggunaan alat wajib diisi.");
      return false;
    }
    if (!PURPOSE_OPTIONS.some((option) => option.value === formData.purpose)) {
      setValidationMessage("Pilihan tujuan tidak valid.");
      return false;
    }
    if (!formData.startTime) {
      setValidationMessage("Waktu mulai wajib diisi.");
      return false;
    }

    const quantity = Number(formData.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setValidationMessage("Jumlah alat harus berupa angka bulat lebih dari 0.");
      return false;
    }

    const start = new Date(toWibIsoString(formData.startTime));
    if (Number.isNaN(start.getTime())) {
      setValidationMessage("Waktu mulai tidak valid.");
      return false;
    }

    if (formData.endTime) {
      const end = new Date(toWibIsoString(formData.endTime));
      if (Number.isNaN(end.getTime()) || start >= end) {
        setValidationMessage(
          "Rentang waktu tidak valid. Pastikan selesai lebih besar dari mulai.",
        );
        return false;
      }
    }

    return true;
  };

  const handleOpenConfirmation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    const result = await createUse({
      equipmentId: formData.equipmentId,
      quantity: Number(formData.quantity),
      purpose: formData.purpose,
      startTime: toWibIsoString(formData.startTime),
      endTime: formData.endTime ? toWibIsoString(formData.endTime) : undefined,
      note: formData.note,
    });

    if (result.ok) {
      toast.success("Pengajuan booking alat berhasil dikirim.");
      setFormData(initialFormData);
      setStartDate(undefined);
      setStartTime("");
      setEndDate(undefined);
      setEndTime("");
      setIsConfirmOpen(false);
      router.push("/use-equipment");
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
          <p className="text-base font-semibold text-slate-900">Form Booking Alat</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ComboboxField
            label="Alat"
            value={formData.equipmentId}
            options={equipmentOptions}
            placeholder="Pilih alat"
            emptyText="Alat tidak ditemukan."
            disabled={isLoadingEquipments || isSubmitting}
            required
            onChange={(value) => handleSelectChange("equipmentId", value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              Jumlah <span className="text-rose-600">*</span>
            </label>
            <Input
              type="number"
              min={1}
              step={1}
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Contoh: 1"
              className="h-11 border-slate-300 bg-white px-3 focus-visible:border-slate-500 focus-visible:ring-slate-200"
              disabled={isSubmitting}
            />
          </div>

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

          <div className="space-y-5">
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
              required={false}
            />
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
            disabled={isSubmitting || isLoadingEquipments}
          >
            Ajukan Booking
          </Button>
        </div>
      </form>

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
              Periksa kembali data booking alat sebelum pengajuan dikirim.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <SummaryItem label="Alat" value={selectedEquipmentLabel} />
            <SummaryItem label="Jumlah" value={formData.quantity} />
            <SummaryItem label="Tujuan" value={formData.purpose} />
            <SummaryItem label="Waktu Mulai (WIB)" value={formatLocalDateTimeAsWib(formData.startTime)} />
            <SummaryItem label="Waktu Selesai (WIB)" value={formatLocalDateTimeAsWib(formData.endTime)} />
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
