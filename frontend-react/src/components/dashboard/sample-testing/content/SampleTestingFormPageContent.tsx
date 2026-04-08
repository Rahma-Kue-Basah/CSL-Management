"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  SubmissionConfirmDialog,
  SubmissionSummaryItem,
} from "@/components/dialogs/SubmissionConfirmDialog";
import InlineErrorAlert from "@/components/shared/InlineErrorAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSampleTesting } from "@/hooks/sample-testing/use-create-sample-testing";
import { useLoadProfile } from "@/hooks/shared/profile/use-load-profile";

type FormData = {
  name: string;
  institution: string;
  institutionAddress: string;
  email: string;
  phoneNumber: string;
  sampleName: string;
  sampleType: string;
  sampleBrand: string;
  samplePackaging: string;
  sampleWeight: string;
  sampleQuantity: string;
  sampleTestingServing: string;
  sampleTestingMethod: string;
  sampleTestingType: string;
};

const initialFormData: FormData = {
  name: "",
  institution: "",
  institutionAddress: "",
  email: "",
  phoneNumber: "",
  sampleName: "",
  sampleType: "",
  sampleBrand: "",
  samplePackaging: "",
  sampleWeight: "",
  sampleQuantity: "",
  sampleTestingServing: "",
  sampleTestingMethod: "",
  sampleTestingType: "",
};

const REQUIRED_FIELD_LABELS: Array<{
  key: keyof FormData;
  label: string;
}> = [
  { key: "name", label: "Nama pemohon" },
  { key: "institution", label: "Institusi" },
  { key: "institutionAddress", label: "Alamat institusi" },
  { key: "email", label: "Email" },
  { key: "phoneNumber", label: "Nomor telepon" },
  { key: "sampleName", label: "Nama sampel" },
  { key: "sampleType", label: "Jenis sampel" },
  { key: "sampleBrand", label: "Merek sampel" },
  { key: "samplePackaging", label: "Kemasan sampel" },
  { key: "sampleWeight", label: "Berat netto / dimensi sampel" },
  { key: "sampleQuantity", label: "Jumlah sampel" },
  { key: "sampleTestingServing", label: "Cara penyajian / penanganan" },
  { key: "sampleTestingMethod", label: "Metode pengujian" },
  { key: "sampleTestingType", label: "Jenis pengujian" },
];

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-600">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      {children}
    </div>
  );
}

export default function SampleTestingFormPage() {
  const router = useRouter();
  const { profile } = useLoadProfile();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [validationMessage, setValidationMessage] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { createSampleTesting, isSubmitting, errorMessage, setErrorMessage } =
    useCreateSampleTesting();

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name || profile.name || "",
      email: prev.email || profile.email || "",
    }));
  }, [profile.email, profile.name]);

  const displaySampleLabel = useMemo(() => {
    if (formData.sampleName.trim()) return formData.sampleName.trim();
    if (formData.sampleType.trim()) return formData.sampleType.trim();
    return "-";
  }, [formData.sampleName, formData.sampleType]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationMessage("");
    setErrorMessage("");
  };

  const validateForm = () => {
    setValidationMessage("");
    setErrorMessage("");

    const emptyRequiredField = REQUIRED_FIELD_LABELS.find(
      ({ key }) => !formData[key].trim(),
    );
    if (emptyRequiredField) {
      setValidationMessage(`${emptyRequiredField.label} wajib diisi.`);
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      setValidationMessage("Format email tidak valid.");
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
    const result = await createSampleTesting({
      name: formData.name,
      institution: formData.institution,
      institutionAddress: formData.institutionAddress,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      sampleName: formData.sampleName,
      sampleType: formData.sampleType,
      sampleBrand: formData.sampleBrand,
      samplePackaging: formData.samplePackaging,
      sampleWeight: formData.sampleWeight,
      sampleQuantity: formData.sampleQuantity,
      sampleTestingServing: formData.sampleTestingServing,
      sampleTestingMethod: formData.sampleTestingMethod,
      sampleTestingType: formData.sampleTestingType,
    });

    if (result.ok) {
      toast.success("Pengajuan pengujian sampel berhasil dikirim.");
      setFormData({
        ...initialFormData,
        name: profile.name || "",
        email: profile.email || "",
      });
      setIsConfirmOpen(false);
      router.push("/sample-testing");
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
            Form Pengujian Sampel
          </p>
        </div>

        {validationMessage ? (
          <InlineErrorAlert>{validationMessage}</InlineErrorAlert>
        ) : null}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Nama Pemohon" required>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nama pemohon"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField label="Email" required>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@contoh.com"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField label="Institusi" required>
            <Input
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="Nama institusi"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField label="Nomor Telepon" required>
            <Input
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="08xxxxxxxxxx"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Alamat Institusi" required>
              <Textarea
                name="institutionAddress"
                value={formData.institutionAddress}
                onChange={handleChange}
                placeholder="Alamat institusi"
                disabled={isSubmitting}
                className="min-h-24"
                required
              />
            </FormField>
          </div>

          <FormField label="Nama Sampel" required>
            <Input
              name="sampleName"
              value={formData.sampleName}
              onChange={handleChange}
              placeholder="Nama sampel"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField label="Jenis Sampel" required>
            <Input
              name="sampleType"
              value={formData.sampleType}
              onChange={handleChange}
              placeholder="Jenis sampel"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField label="Merek Sampel" required>
            <Input
              name="sampleBrand"
              value={formData.sampleBrand}
              onChange={handleChange}
              placeholder="Merek sampel"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField label="Kemasan Sampel" required>
            <Input
              name="samplePackaging"
              value={formData.samplePackaging}
              onChange={handleChange}
              placeholder="Kemasan sampel"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField label="Berat Netto / Dimensi Sampel" required>
            <Input
              name="sampleWeight"
              value={formData.sampleWeight}
              onChange={handleChange}
              placeholder="Contoh: 250 gr"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField label="Jumlah Sampel" required>
            <Input
              name="sampleQuantity"
              value={formData.sampleQuantity}
              onChange={handleChange}
              placeholder="Contoh: 3 botol"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Cara Penyajian / Penanganan" required>
              <Textarea
                name="sampleTestingServing"
                value={formData.sampleTestingServing}
                onChange={handleChange}
                placeholder="Cara penyajian atau penanganan sampel"
                disabled={isSubmitting}
                className="min-h-24"
                required
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="Metode Pengujian" required>
              <Textarea
                name="sampleTestingMethod"
                value={formData.sampleTestingMethod}
                onChange={handleChange}
                placeholder="Metode pengujian yang dibutuhkan"
                disabled={isSubmitting}
                className="min-h-24"
                required
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="Jenis Pengujian" required>
              <Textarea
                name="sampleTestingType"
                value={formData.sampleTestingType}
                onChange={handleChange}
                placeholder="Jenis pengujian yang diajukan"
                disabled={isSubmitting}
                className="min-h-24"
                required
              />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-[#0052C7] text-white hover:bg-[#0048B4]"
          >
            Ajukan Pengujian
          </Button>
        </div>
      </form>

      <SubmissionConfirmDialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (isSubmitting) return;
          setIsConfirmOpen(open);
        }}
        title="Konfirmasi Pengajuan Pengujian Sampel"
        description="Pastikan seluruh informasi pengujian sampel sudah benar sebelum dikirim."
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onConfirm={handleConfirmSubmit}
      >
        <div className="space-y-3">
          <SubmissionSummaryItem
            label="Nama Pemohon"
            value={formData.name}
          />
          <SubmissionSummaryItem
            label="Email"
            value={formData.email}
          />
          <SubmissionSummaryItem
            label="Institusi"
            value={formData.institution}
          />
          <SubmissionSummaryItem
            label="Nomor Telepon"
            value={formData.phoneNumber}
          />
          <SubmissionSummaryItem
            label="Alamat Institusi"
            value={formData.institutionAddress}
          />
          <SubmissionSummaryItem
            label="Sampel"
            value={displaySampleLabel}
          />
          <SubmissionSummaryItem
            label="Jenis Sampel"
            value={formData.sampleType}
          />
          <SubmissionSummaryItem
            label="Merek Sampel"
            value={formData.sampleBrand}
          />
          <SubmissionSummaryItem
            label="Kemasan Sampel"
            value={formData.samplePackaging}
          />
          <SubmissionSummaryItem
            label="Berat Sampel"
            value={formData.sampleWeight}
          />
          <SubmissionSummaryItem
            label="Jumlah Sampel"
            value={formData.sampleQuantity}
          />
          <SubmissionSummaryItem
            label="Cara Penyajian / Penanganan"
            value={formData.sampleTestingServing}
          />
          <SubmissionSummaryItem
            label="Metode Pengujian"
            value={formData.sampleTestingMethod}
          />
          <SubmissionSummaryItem
            label="Jenis Pengujian"
            value={formData.sampleTestingType}
          />
        </div>
      </SubmissionConfirmDialog>
    </section>
  );
}
