"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import InlineErrorAlert from "@/components/shared/inline-error-alert";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateBorrow } from "@/hooks/borrows/use-create-borrow";
import { useEquipmentOptions } from "@/hooks/equipments/use-equipment-options";
import { formatLocalDateTimeAsWib, toWibIsoString } from "@/lib/date-format";
import { cn } from "@/lib/utils";

type FormData = {
  equipmentId: string;
  quantity: string;
  startTime: string;
  endTime: string;
  purpose: string;
  note: string;
};

type SelectOption = {
  value: string;
  label: string;
};

const PURPOSE_OPTIONS: SelectOption[] = [
  { value: "Class", label: "Class" },
  { value: "Lab Work", label: "Lab Work" },
  { value: "Research", label: "Research" },
  { value: "Other", label: "Other" },
];

const initialFormData: FormData = {
  equipmentId: "",
  quantity: "1",
  startTime: "",
  endTime: "",
  purpose: "Other",
  note: "",
};

function combineDateTime(date: Date | undefined, time: string) {
  if (!date || !time) return "";
  return `${format(date, "yyyy-MM-dd")}T${time}`;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  const displayValue = value?.trim() ? value : "-";

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-sm",
          displayValue === "-"
            ? "italic text-slate-400"
            : "font-medium text-slate-800",
        )}
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
      <label
        htmlFor={`${id}-time`}
        className="text-xs font-medium text-slate-600"
      >
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

export default function BorrowEquipmentFormPage() {
  const navigate = useNavigate();
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
  } = useEquipmentOptions("available", "", true, true);
  const { createBorrow, isSubmitting, errorMessage, setErrorMessage } =
    useCreateBorrow();

  const equipmentOptions = useMemo<SelectOption[]>(
    () =>
      equipments.map((equipment) => ({
        value: equipment.id,
        label: `${equipment.label} (stok: ${equipment.quantity})`,
      })),
    [equipments],
  );
  const selectedEquipment = useMemo(
    () =>
      equipments.find((equipment) => equipment.id === formData.equipmentId) ??
      null,
    [equipments, formData.equipmentId],
  );
  const selectedPurposeLabel = useMemo(
    () =>
      PURPOSE_OPTIONS.find((option) => option.value === formData.purpose)
        ?.label ?? "-",
    [formData.purpose],
  );
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

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const handleSelectEquipment = (value: string) => {
    setFormData((prev) => ({ ...prev, equipmentId: value }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const handleSelectPurpose = (value: string) => {
    setFormData((prev) => ({ ...prev, purpose: value }));
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

  const validateForm = () => {
    if (!formData.equipmentId) return "Pilih alat yang ingin dipinjam.";

    const quantityValue = Number(formData.quantity);
    if (!Number.isInteger(quantityValue) || quantityValue < 1) {
      return "Jumlah alat minimal 1.";
    }

    if (selectedEquipment && quantityValue > selectedEquipment.quantity) {
      return `Jumlah melebihi stok tersedia (${selectedEquipment.quantity}).`;
    }

    if (!formData.startTime) return "Pilih waktu mulai peminjaman.";
    if (!formData.endTime) return "Pilih waktu selesai peminjaman.";
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      return "Waktu selesai harus setelah waktu mulai.";
    }
    if (!formData.purpose.trim()) return "Pilih tujuan peminjaman.";
    if (!PURPOSE_OPTIONS.some((option) => option.value === formData.purpose)) {
      return "Tujuan peminjaman tidak valid.";
    }

    return "";
  };

  const handleOpenConfirmation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationMessage("");
    setErrorMessage("");

    const message = validateForm();
    if (message) {
      setValidationMessage(message);
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    const result = await createBorrow({
      equipmentId: formData.equipmentId,
      quantity: Number(formData.quantity),
      startTime: toWibIsoString(formData.startTime),
      endTime: toWibIsoString(formData.endTime),
      purpose: formData.purpose,
      note: formData.note,
    });

    if (!result.ok) return;

    toast.success("Pengajuan peminjaman alat berhasil dibuat.");
    setIsConfirmOpen(false);
    navigate("/borrow-equipment");
  };

  return (
    <section className="space-y-4">
      <form
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(15,23,42,0.05)]"
        onSubmit={handleOpenConfirmation}
      >
        <div className="border-b border-slate-200 pb-4">
          <p className="text-base font-semibold text-slate-900">
            Form Peminjaman Alat
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <ComboboxField
              label="Pilih Alat"
              value={formData.equipmentId}
              options={equipmentOptions}
              placeholder={
                isLoadingEquipments ? "Memuat alat..." : "Cari dan pilih alat"
              }
              emptyText={
                isLoadingEquipments
                  ? "Memuat..."
                  : "Tidak ada alat yang tersedia"
              }
              disabled={isLoadingEquipments || isSubmitting}
              required
              onChange={handleSelectEquipment}
            />
            {equipmentError ? (
              <p className="mt-2 text-xs text-rose-600">{equipmentError}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="quantity"
              className="text-xs font-medium text-slate-600"
            >
              Jumlah <span className="text-rose-600">*</span>
            </label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              max={selectedEquipment?.quantity || undefined}
              value={formData.quantity}
              onChange={handleChange}
              disabled={isSubmitting}
              className="h-11 border-slate-300 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <ComboboxField
              label="Tujuan Peminjaman"
              value={formData.purpose}
              options={PURPOSE_OPTIONS}
              placeholder="Pilih tujuan"
              emptyText="Pilihan tujuan tidak tersedia"
              disabled={isSubmitting}
              required
              onChange={handleSelectPurpose}
            />
          </div>

          <DateTimePickerField
            id="start-time"
            label="Waktu Mulai (WIB)"
            date={startDate}
            time={startTime}
            disabled={isSubmitting}
            onDateChange={handleStartDateChange}
            onTimeChange={handleStartTimeChange}
          />

          <div className="hidden md:block" />

          <DateTimePickerField
            id="end-time"
            label="Waktu Selesai (WIB)"
            date={endDate}
            time={endTime}
            disabled={isSubmitting}
            minDate={minEndDate}
            minTime={minEndTime}
            onDateChange={handleEndDateChange}
            onTimeChange={handleEndTimeChange}
          />

          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="note"
              className="text-xs font-medium text-slate-600"
            >
              Catatan
            </label>
            <Textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Tambahkan detail tambahan bila perlu"
              className="min-h-28 border-slate-300 bg-white"
            />
          </div>
        </div>

        {validationMessage ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {validationMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <InlineErrorAlert className="mt-4">{errorMessage}</InlineErrorAlert>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingEquipments}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Ajukan Peminjaman"
            )}
          </Button>
        </div>
      </form>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="max-w-xl border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>Konfirmasi Pengajuan</AlertDialogTitle>
            <AlertDialogDescription>
              Periksa kembali data peminjaman alat sebelum pengajuan dikirim.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <SummaryItem label="Alat" value={selectedEquipment?.label ?? "-"} />
            <SummaryItem label="Jumlah" value={formData.quantity} />
            <SummaryItem
              label="Waktu Mulai (WIB)"
              value={formatLocalDateTimeAsWib(formData.startTime)}
            />
            <SummaryItem
              label="Waktu Selesai (WIB)"
              value={formatLocalDateTimeAsWib(formData.endTime)}
            />
            <SummaryItem label="Tujuan" value={selectedPurposeLabel} />
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
