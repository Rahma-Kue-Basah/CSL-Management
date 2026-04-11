"use client";


import { useEffect, useMemo, useState } from "react";

import { Loader2, Plus, Trash2 } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "sonner";

import {
  SubmissionConfirmDialog,
  SubmissionSummaryItem,
} from "@/components/dialogs";

import {
  DashboardComboboxField,
  DashboardDateTimePickerField,
  combineDateTime,
  getMinSelectableTime,
  startOfToday,
  type SelectOption,
} from "@/components/shared";

import { Button, Input } from "@/components/ui";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";

import { useCreateBookingRoom } from "@/hooks/booking-rooms";

import { useEquipmentOptions } from "@/hooks/shared/resources/equipments";

import { useLoadProfile } from "@/hooks/shared/profile";

import { useRoomOptions } from "@/hooks/shared/resources/rooms";

import { useMentorOptions } from "@/hooks/shared/resources/users";

import {
  canAccessPracticumPurpose,
  canAccessThesisPurpose,
  getRequestPurposeOptions,
  THESIS_PURPOSE,
  WORKSHOP_PURPOSE,
} from "@/constants/request-purpose";

import { formatLocalDateTimeAsWib, toWibIsoString } from "@/lib/date";

type FormData = {
  roomId: string;
  purpose: string;
  startTime: string;
  endTime: string;
  attendeeCount: string;
  attendeeNames: string;
  note: string;
  requesterPhone: string;
  requesterMentor: string;
  requesterMentorProfileId: string;
  institution: string;
  institutionAddress: string;
  workshopInstitution: string;
  workshopPic: string;
  workshopTitle: string;
  equipmentItems: Array<{
    equipmentId: string;
    quantity: string;
  }>;
};

const initialFormData: FormData = {
  roomId: "",
  purpose: "Penelitian",
  startTime: "",
  endTime: "",
  attendeeCount: "1",
  attendeeNames: "",
  note: "",
  requesterPhone: "",
  requesterMentor: "",
  requesterMentorProfileId: "",
  institution: "",
  institutionAddress: "",
  workshopInstitution: "",
  workshopPic: "",
  workshopTitle: "",
  equipmentItems: [],
};

export default function BookingRoomsFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = useMemo(() => startOfToday(), []);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const { profile } = useLoadProfile();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const normalizedRole = normalizeRoleValue(profile.role);
  const isGuestUser = normalizedRole === ROLE_VALUES.GUEST;
  const canSelectPracticumPurpose = canAccessPracticumPurpose(profile.role);
  const canSelectThesisPurpose = canAccessThesisPurpose(profile.role);
  const isWorkshopPurpose = formData.purpose === WORKSHOP_PURPOSE;
  const isThesisPurpose = formData.purpose === THESIS_PURPOSE;
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
  const {
    mentors,
    isLoading: isLoadingMentors,
    error: mentorError,
  } = useMentorOptions(!isGuestUser && isThesisPurpose);
  const { createBookingRoom, isSubmitting, errorMessage, setErrorMessage } =
    useCreateBookingRoom();
  const preselectedRoomId = searchParams.get("room") ?? "";
  const availablePurposeOptions = useMemo(
    () =>
      getRequestPurposeOptions({
        includePracticum: canSelectPracticumPurpose,
        includeWorkshop: !isGuestUser,
        includeThesis: canSelectThesisPurpose,
      }),
    [canSelectPracticumPurpose, canSelectThesisPurpose, isGuestUser],
  );

  const minEndDate = startDate ? new Date(startDate) : new Date(today);
  if (minEndDate) {
    minEndDate.setHours(0, 0, 0, 0);
  }
  const minEndTime =
    startDate &&
    endDate &&
    startDate.getTime() === endDate.getTime()
      ? startTime || undefined
      : undefined;
  const minStartTime = getMinSelectableTime(startDate, today);

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
  const mentorOptions = useMemo<SelectOption[]>(
    () => mentors.map((mentor) => ({ value: mentor.id, label: mentor.label })),
    [mentors],
  );

  useEffect(() => {
    if (!preselectedRoomId || formData.roomId) return;
    if (!rooms.some((room) => room.id === preselectedRoomId)) return;
    setFormData((prev) => ({ ...prev, roomId: preselectedRoomId }));
  }, [formData.roomId, preselectedRoomId, rooms]);

  useEffect(() => {
    if (availablePurposeOptions.some((option) => option.value === formData.purpose)) return;
    setFormData((prev) => ({
      ...prev,
      purpose: "Penelitian",
      requesterMentor: "",
      requesterMentorProfileId: "",
      workshopInstitution: "",
      workshopPic: "",
      workshopTitle: "",
    }));
  }, [availablePurposeOptions, formData.purpose]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "attendeeCount" && Number(value) <= 1
        ? { attendeeNames: "" }
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

  const handleSelectChange = (name: "roomId" | "purpose", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "roomId" ? { equipmentItems: [] } : {}),
      ...(name === "purpose" && value !== WORKSHOP_PURPOSE
        ? {
            workshopInstitution: "",
            workshopPic: "",
            workshopTitle: "",
          }
        : {}),
      ...(name === "purpose" && value !== THESIS_PURPOSE
        ? {
            requesterMentor: "",
            requesterMentorProfileId: "",
          }
        : {}),
      ...(name === "purpose" && value === WORKSHOP_PURPOSE
        ? { attendeeNames: "" }
        : {}),
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
    if (!availablePurposeOptions.some((option) => option.value === formData.purpose)) {
      setValidationMessage("Pilihan tujuan tidak valid.");
      return false;
    }
    if (!isGuestUser && isThesisPurpose && !formData.requesterMentorProfileId) {
      setValidationMessage("Dosen pembimbing wajib dipilih untuk tujuan Skripsi/TA.");
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      setValidationMessage("Waktu mulai dan waktu selesai wajib diisi.");
      return false;
    }
    const attendeeCount = Number(formData.attendeeCount);
    if (!Number.isInteger(attendeeCount) || attendeeCount <= 0) {
      setValidationMessage(
        "Jumlah peserta harus berupa angka bulat lebih dari 0.",
      );
      return false;
    }
    if (selectedRoom && attendeeCount > selectedRoom.capacity) {
      setValidationMessage(
        `Jumlah peserta tidak boleh melebihi kapasitas ruangan (${selectedRoom.capacity} peserta).`,
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
      requesterPhone: formData.requesterPhone,
      requesterMentor: isGuestUser ? "" : formData.requesterMentor,
      requesterMentorProfileId: isGuestUser ? "" : formData.requesterMentorProfileId,
      institution: formData.institution,
      institutionAddress: formData.institutionAddress,
      workshopTitle: formData.workshopTitle,
      workshopPic: formData.workshopPic,
      workshopInstitution: formData.workshopInstitution,
      equipmentItems: formData.equipmentItems.map((item) => ({
        equipmentId: item.equipmentId,
        quantity: Number(item.quantity),
      })),
    });

    if (result.ok) {
      toast.success("Pengajuan peminjaman lab berhasil dikirim.");
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
            Form Peminjaman Lab
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <DashboardComboboxField
            label="Ruangan"
            value={formData.roomId}
            options={roomOptions}
            placeholder="Pilih ruangan"
            emptyText="Ruangan tidak ditemukan."
            disabled={isLoadingRooms || isSubmitting}
            required
            onChange={(value) => handleSelectChange("roomId", value)}
          />

          <DashboardComboboxField
            label="Tujuan"
            value={formData.purpose}
              options={availablePurposeOptions}
            placeholder="Pilih tujuan"
            emptyText="Tujuan tidak ditemukan."
            disabled={isSubmitting}
            required
            onChange={(value) => handleSelectChange("purpose", value)}
          />

          <div className="grid gap-5 md:col-span-2 md:grid-cols-2">
            <DashboardDateTimePickerField
              id="start-time"
              label="Waktu Mulai (WIB)"
              date={startDate}
              time={startTime}
              minDate={today}
              minTime={minStartTime}
              onDateChange={handleStartDateChange}
              onTimeChange={handleStartTimeChange}
              disabled={isSubmitting}
            />

            <DashboardDateTimePickerField
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
              Jumlah Peserta <span className="text-rose-600">*</span>
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
              Nomor Telepon Pemohon
            </label>
            <Input
              type="text"
              name="requesterPhone"
              value={formData.requesterPhone}
              onChange={handleChange}
              placeholder="Contoh: 08123456789"
              className="h-11 border-slate-300 bg-white px-3 focus-visible:border-slate-500 focus-visible:ring-slate-200"
              disabled={isSubmitting}
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

          {isGuestUser ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Institusi
                </label>
                <Input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="Nama institusi"
                  className="h-11 border-slate-300 bg-white px-3 focus-visible:border-slate-500 focus-visible:ring-slate-200"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Alamat Institusi
                </label>
                <Input
                  type="text"
                  name="institutionAddress"
                  value={formData.institutionAddress}
                  onChange={handleChange}
                  placeholder="Alamat institusi"
                  className="h-11 border-slate-300 bg-white px-3 focus-visible:border-slate-500 focus-visible:ring-slate-200"
                  disabled={isSubmitting}
                />
              </div>
            </>
          ) : null}

          {isWorkshopPurpose ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Judul Workshop
                </label>
                <Input
                  type="text"
                  name="workshopTitle"
                  value={formData.workshopTitle}
                  onChange={handleChange}
                  placeholder="Judul workshop"
                  className="h-11 border-slate-300 bg-white px-3 focus-visible:border-slate-500 focus-visible:ring-slate-200"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  PIC Workshop
                </label>
                <Input
                  type="text"
                  name="workshopPic"
                  value={formData.workshopPic}
                  onChange={handleChange}
                  placeholder="Nama PIC workshop"
                  className="h-11 border-slate-300 bg-white px-3 focus-visible:border-slate-500 focus-visible:ring-slate-200"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Institusi Workshop
                </label>
                <Input
                  type="text"
                  name="workshopInstitution"
                  value={formData.workshopInstitution}
                  onChange={handleChange}
                  placeholder="Nama institusi workshop"
                  className="h-11 border-slate-300 bg-white px-3 focus-visible:border-slate-500 focus-visible:ring-slate-200"
                  disabled={isSubmitting}
                />
              </div>
            </>
          ) : null}

          {Number(formData.attendeeCount) > 1 && !isWorkshopPurpose ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">
                Nama Peserta
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
          ) : null}

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
                    <DashboardComboboxField
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
            className="min-w-[180px] gap-2"
            disabled={isSubmitting || isLoadingRooms}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Ajukan Booking"
            )}
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

      <SubmissionConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Konfirmasi Pengajuan"
        description="Periksa kembali data peminjaman lab sebelum pengajuan dikirim."
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onConfirm={() => void handleConfirmSubmit()}
      >
        <SubmissionSummaryItem label="Ruangan" value={selectedRoomLabel} />
        <SubmissionSummaryItem
          label="Tujuan"
          value={
            availablePurposeOptions.find((option) => option.value === formData.purpose)
              ?.label ?? formData.purpose
          }
        />
        <SubmissionSummaryItem
          label="Waktu Mulai (WIB)"
          value={formatLocalDateTimeAsWib(formData.startTime)}
        />
        <SubmissionSummaryItem
          label="Waktu Selesai (WIB)"
          value={formatLocalDateTimeAsWib(formData.endTime)}
        />
        <SubmissionSummaryItem
          label="Jumlah Peserta"
          value={formData.attendeeCount}
        />
        {Number(formData.attendeeCount) > 1 && !isWorkshopPurpose ? (
          <SubmissionSummaryItem
            label="Nama Peserta"
            value={formData.attendeeNames}
          />
        ) : null}
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
        {isWorkshopPurpose ? (
          <>
            <SubmissionSummaryItem
              label="Judul Workshop"
              value={formData.workshopTitle}
            />
            <SubmissionSummaryItem label="PIC Workshop" value={formData.workshopPic} />
            <SubmissionSummaryItem
              label="Institusi Workshop"
              value={formData.workshopInstitution}
            />
          </>
        ) : null}
        <SubmissionSummaryItem label="Peralatan" value={selectedEquipmentLabel} />
        <SubmissionSummaryItem label="Catatan" value={formData.note} />
      </SubmissionConfirmDialog>
    </section>
  );
}
