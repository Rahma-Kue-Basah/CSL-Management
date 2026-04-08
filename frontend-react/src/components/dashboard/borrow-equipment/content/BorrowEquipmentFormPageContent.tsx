"use client";


import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { Loader2 } from "lucide-react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { toast } from "sonner";

import {
  SubmissionConfirmDialog,
  SubmissionSummaryItem,
} from "@/components/dialogs";

import {
  DashboardComboboxField,
  DashboardDateTimePickerField,
  InlineErrorAlert,
  combineDateTime,
  getMinSelectableTime,
  isSameCalendarDay,
  startOfToday,
  type SelectOption,
} from "@/components/shared";

import { Button, Input, Textarea } from "@/components/ui";

import { useCreateBorrow } from "@/hooks/borrow-equipment";

import { useEquipmentOptions } from "@/hooks/shared/resources/equipments";

import { useLoadProfile } from "@/hooks/shared/profile";

import { useMentorOptions } from "@/hooks/shared/resources/users";

import {
  REQUEST_PURPOSE_OPTIONS_NO_WORKSHOP,
  THESIS_PURPOSE,
} from "@/constants/request-purpose";

import { formatLocalDateTimeAsWib, toWibIsoString } from "@/lib/date";

type FormData = {
  equipmentId: string;
  quantity: string;
  startTime: string;
  endTime: string;
  purpose: string;
  note: string;
  requesterPhone: string;
  requesterMentor: string;
  requesterMentorProfileId: string;
  institution: string;
  institutionAddress: string;
};

const initialFormData: FormData = {
  equipmentId: "",
  quantity: "1",
  startTime: "",
  endTime: "",
  purpose: "Penelitian",
  note: "",
  requesterPhone: "",
  requesterMentor: "",
  requesterMentorProfileId: "",
  institution: "",
  institutionAddress: "",
};

export default function BorrowEquipmentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const today = useMemo(() => startOfToday(), []);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const { profile } = useLoadProfile();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const isGuestUser = profile.role === "Guest";
  const isThesisPurpose = formData.purpose === THESIS_PURPOSE;
  const {
    equipments,
    isLoading: isLoadingEquipments,
    error: equipmentError,
  } = useEquipmentOptions("Available", "", true, true);
  const {
    mentors,
    isLoading: isLoadingMentors,
    error: mentorError,
  } = useMentorOptions(!isGuestUser && isThesisPurpose);
  const { createBorrow, isSubmitting, errorMessage, setErrorMessage } =
    useCreateBorrow();
  const preselectedEquipmentId = searchParams.get("equipment") ?? "";

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
      REQUEST_PURPOSE_OPTIONS_NO_WORKSHOP.find((option) => option.value === formData.purpose)
        ?.label ?? "-",
    [formData.purpose],
  );
  const mentorOptions = useMemo<SelectOption[]>(
    () => mentors.map((mentor) => ({ value: mentor.id, label: mentor.label })),
    [mentors],
  );

  useEffect(() => {
    if (!preselectedEquipmentId || formData.equipmentId) return;
    if (!equipments.some((equipment) => equipment.id === preselectedEquipmentId)) return;
    setFormData((prev) => ({ ...prev, equipmentId: preselectedEquipmentId }));
  }, [equipments, formData.equipmentId, preselectedEquipmentId]);
  const minEndDate = startDate ? new Date(startDate) : new Date(today);
  if (minEndDate) {
    minEndDate.setHours(0, 0, 0, 0);
  }
  const minEndTime =
    startDate &&
    endDate &&
    isSameCalendarDay(startDate, endDate)
      ? startTime || undefined
      : undefined;
  const minStartTime = getMinSelectableTime(startDate, today);

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
    setFormData((prev) => ({
      ...prev,
      purpose: value,
      ...(value !== THESIS_PURPOSE
        ? {
            requesterMentor: "",
            requesterMentorProfileId: "",
          }
        : {}),
    }));
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
    if (!REQUEST_PURPOSE_OPTIONS_NO_WORKSHOP.some((option) => option.value === formData.purpose)) {
      return "Tujuan peminjaman tidak valid.";
    }
    if (!isGuestUser && isThesisPurpose && !formData.requesterMentorProfileId) {
      return "Dosen pembimbing wajib dipilih untuk tujuan Skripsi/TA.";
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
      requesterPhone: formData.requesterPhone,
      requesterMentor: formData.requesterMentor,
      requesterMentorProfileId: formData.requesterMentorProfileId,
      institution: formData.institution,
      institutionAddress: formData.institutionAddress,
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
            <DashboardComboboxField
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
            <DashboardComboboxField
              label="Tujuan Peminjaman"
              value={formData.purpose}
              options={REQUEST_PURPOSE_OPTIONS_NO_WORKSHOP}
              placeholder="Pilih tujuan"
              emptyText="Pilihan tujuan tidak tersedia"
              disabled={isSubmitting}
              required
              onChange={handleSelectPurpose}
            />
          </div>

          {!isGuestUser && isThesisPurpose ? (
            <div className="space-y-1.5">
              <DashboardComboboxField
                label="Dosen Pembimbing"
                value={formData.requesterMentorProfileId}
                options={mentorOptions}
                placeholder="Pilih dosen pembimbing"
                emptyText="Dosen pembimbing tidak ditemukan."
                disabled={isSubmitting || isLoadingMentors}
                required
                onChange={(value) => {
                  const selectedMentor = mentors.find((mentor) => mentor.id === value);
                  setFormData((prev) => ({
                    ...prev,
                    requesterMentorProfileId: value,
                    requesterMentor: selectedMentor?.label ?? "",
                  }));
                  setValidationMessage("");
                  setErrorMessage("");
                }}
              />
              {mentorError ? (
                <p className="text-xs text-rose-600">{mentorError}</p>
              ) : null}
            </div>
          ) : null}

          <DashboardDateTimePickerField
            id="start-time"
            label="Waktu Mulai (WIB)"
            date={startDate}
            time={startTime}
            disabled={isSubmitting}
            minDate={today}
            minTime={minStartTime}
            onDateChange={handleStartDateChange}
            onTimeChange={handleStartTimeChange}
          />

          <DashboardDateTimePickerField
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

          <div className="space-y-1.5">
            <label
              htmlFor="requesterPhone"
              className="text-xs font-medium text-slate-600"
            >
              Nomor Telepon Pemohon
            </label>
            <Input
              id="requesterPhone"
              name="requesterPhone"
              type="text"
              value={formData.requesterPhone}
              onChange={handleChange}
              disabled={isSubmitting}
              className="h-11 border-slate-300 bg-white"
            />
          </div>

          {isGuestUser ? (
            <>
              <div className="space-y-1.5">
                <label
                  htmlFor="institution"
                  className="text-xs font-medium text-slate-600"
                >
                  Institusi
                </label>
                <Input
                  id="institution"
                  name="institution"
                  type="text"
                  value={formData.institution}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="h-11 border-slate-300 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="institutionAddress"
                  className="text-xs font-medium text-slate-600"
                >
                  Alamat Institusi
                </label>
                <Input
                  id="institutionAddress"
                  name="institutionAddress"
                  type="text"
                  value={formData.institutionAddress}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="h-11 border-slate-300 bg-white"
                />
              </div>
            </>
          ) : null}

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

      <SubmissionConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Konfirmasi Pengajuan"
        description="Periksa kembali data peminjaman alat sebelum pengajuan dikirim."
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onConfirm={() => void handleConfirmSubmit()}
      >
        <SubmissionSummaryItem
          label="Alat"
          value={selectedEquipment?.label ?? "-"}
        />
        <SubmissionSummaryItem label="Jumlah" value={formData.quantity} />
        <SubmissionSummaryItem
          label="Waktu Mulai (WIB)"
          value={formatLocalDateTimeAsWib(formData.startTime)}
        />
        <SubmissionSummaryItem
          label="Waktu Selesai (WIB)"
          value={formatLocalDateTimeAsWib(formData.endTime)}
        />
        <SubmissionSummaryItem label="Tujuan" value={selectedPurposeLabel} />
        <SubmissionSummaryItem
          label="Nomor Telepon Pemohon"
          value={formData.requesterPhone}
        />
        {!isGuestUser && isThesisPurpose ? (
          <SubmissionSummaryItem
            label="Dosen Pembimbing"
            value={formData.requesterMentor}
          />
        ) : null}
        {isGuestUser ? (
          <>
            <SubmissionSummaryItem label="Institusi" value={formData.institution} />
            <SubmissionSummaryItem
              label="Alamat Institusi"
              value={formData.institutionAddress}
            />
          </>
        ) : null}
        <SubmissionSummaryItem label="Catatan" value={formData.note} />
      </SubmissionConfirmDialog>
    </section>
  );
}
