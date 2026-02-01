"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePickerTime } from "@/components/ui/date-picker-time";
import { PURPOSE_OPTIONS } from "@/constants/purposes";
import { API_BORROW_DETAIL } from "@/constants/api";
import { useEquipmentOptions } from "@/hooks/use-equipment-options";
import { useBorrowActions } from "@/hooks/use-borrow-actions";
import { authFetch } from "@/lib/auth-fetch";

const INITIAL_FORM = {
  equipmentId: "",
  quantity: "",
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

export function BorrowForm({ borrowId }) {
  const router = useRouter();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState("");
  const {
    equipments,
    isLoading: isLoadingEquipments,
    error: equipmentError,
  } = useEquipmentOptions();
  const {
    createBorrow,
    updateBorrow,
    isSubmitting,
    errorMessage: submitError,
    setErrorMessage: setSubmitError,
  } = useBorrowActions();

  useEffect(() => {
    const loadDetail = async () => {
      if (!borrowId) return;
      setErrorMessage("");
      try {
        const resp = await authFetch(API_BORROW_DETAIL(borrowId));
        if (!resp.ok) throw new Error("Gagal memuat data peminjaman.");
        const data = await resp.json();
        setFormData({
          equipmentId: data.equipment || "",
          quantity: data.quantity?.toString() || "",
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
  }, [borrowId]);

  useEffect(() => {
    if (submitError) setErrorMessage(submitError);
  }, [submitError]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const helperText = useMemo(
    () =>
      borrowId
        ? "Perbarui data peminjaman equipment sesuai kebutuhan."
        : "Ajukan peminjaman equipment sesuai kebutuhan.",
    [borrowId],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSubmitError("");

    if (!formData.equipmentId) {
      setErrorMessage("Equipment wajib dipilih.");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setErrorMessage("Jumlah harus lebih dari 0.");
      return;
    }
    if (!formData.startDate || !formData.startTime) {
      setErrorMessage("Tanggal dan jam mulai wajib diisi.");
      return;
    }
    if (
      (formData.endDate && !formData.endTime) ||
      (!formData.endDate && formData.endTime)
    ) {
      setErrorMessage("Tanggal dan jam selesai harus diisi bersamaan.");
      return;
    }

    const result = borrowId
      ? await updateBorrow(borrowId, formData)
      : await createBorrow(formData);

    if (result.ok) {
      router.push("/my-borrows-request");
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
              <label className="text-xs font-medium">Equipment</label>
              <select
                name="equipmentId"
                value={formData.equipmentId}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                disabled={isLoadingEquipments}
                required
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
              <label className="text-xs font-medium">Jumlah</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                min="1"
                placeholder="1"
                required
              />
            </div>
            <div className="space-y-1">
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
                dateId="borrow-start-date"
                timeId="borrow-start-time"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <DatePickerTime
                dateLabel="Tanggal Selesai (Rencana)"
                timeLabel="Jam Selesai"
                date={formData.endDate}
                onDateChange={(date) =>
                  setFormData((prev) => ({ ...prev, endDate: date }))
                }
                time={formData.endTime}
                onTimeChange={(value) =>
                  setFormData((prev) => ({ ...prev, endTime: value }))
                }
                dateId="borrow-end-date"
                timeId="borrow-end-time"
              />
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
                : borrowId
                  ? "Perbarui Peminjaman"
                  : "Simpan Peminjaman"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default BorrowForm;
