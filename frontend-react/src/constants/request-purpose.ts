import type { SelectOption } from "@/components/shared/dashboard-form-fields";

export const WORKSHOP_PURPOSE = "Workshop";

export const REQUEST_PURPOSE_OPTIONS: SelectOption[] = [
  { value: "Thesis", label: "Skripsi/TA" },
  { value: "Practicum", label: "Praktikum" },
  { value: "Research", label: "Penelitian" },
  { value: WORKSHOP_PURPOSE, label: "Workshop" },
];

export const REQUEST_PURPOSE_OPTIONS_NO_WORKSHOP: SelectOption[] =
  REQUEST_PURPOSE_OPTIONS.filter((option) => option.value !== WORKSHOP_PURPOSE);
