import type { SelectOption } from "@/components/shared/DashboardFormFields";

export const THESIS_PURPOSE = "Skripsi/TA";
export const WORKSHOP_PURPOSE = "Workshop";

export const REQUEST_PURPOSE_OPTIONS: SelectOption[] = [
  { value: THESIS_PURPOSE, label: THESIS_PURPOSE },
  { value: "Praktikum", label: "Praktikum" },
  { value: "Penelitian", label: "Penelitian" },
  { value: WORKSHOP_PURPOSE, label: "Workshop" },
];

export const REQUEST_PURPOSE_OPTIONS_NO_WORKSHOP: SelectOption[] =
  REQUEST_PURPOSE_OPTIONS.filter((option) => option.value !== WORKSHOP_PURPOSE);
