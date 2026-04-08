import type { SelectOption } from "@/components/shared";

export const THESIS_PURPOSE = "Skripsi/TA";
export const WORKSHOP_PURPOSE = "Workshop";

export const REQUEST_PURPOSE_OPTIONS: SelectOption[] = [
  { value: THESIS_PURPOSE, label: THESIS_PURPOSE },
  { value: "Praktikum", label: "Praktikum" },
  { value: "Penelitian", label: "Penelitian" },
  { value: WORKSHOP_PURPOSE, label: "Workshop" },
];

type RequestPurposeOptionsConfig = {
  includeWorkshop?: boolean;
  includeThesis?: boolean;
};

export function getRequestPurposeOptions(
  {
    includeWorkshop = true,
    includeThesis = true,
  }: RequestPurposeOptionsConfig = {},
): SelectOption[] {
  return REQUEST_PURPOSE_OPTIONS.filter((option) => {
    if (!includeWorkshop && option.value === WORKSHOP_PURPOSE) return false;
    if (!includeThesis && option.value === THESIS_PURPOSE) return false;
    return true;
  });
}

export const REQUEST_PURPOSE_OPTIONS_NO_WORKSHOP: SelectOption[] =
  getRequestPurposeOptions({ includeWorkshop: false });
