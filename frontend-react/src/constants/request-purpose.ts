import type { SelectOption } from "@/components/shared";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";

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
  includePracticum?: boolean;
};

export function canAccessThesisPurpose(role?: string | null): boolean {
  return normalizeRoleValue(role) === ROLE_VALUES.STUDENT;
}

export function canAccessPracticumPurpose(role?: string | null): boolean {
  return normalizeRoleValue(role) !== ROLE_VALUES.GUEST;
}

export function getRequestPurposeOptions(
  {
    includeWorkshop = true,
    includeThesis = true,
    includePracticum = true,
  }: RequestPurposeOptionsConfig = {},
): SelectOption[] {
  return REQUEST_PURPOSE_OPTIONS.filter((option) => {
    if (!includeWorkshop && option.value === WORKSHOP_PURPOSE) return false;
    if (!includeThesis && option.value === THESIS_PURPOSE) return false;
    if (!includePracticum && option.value === "Praktikum") return false;
    return true;
  });
}

export const REQUEST_PURPOSE_OPTIONS_NO_WORKSHOP: SelectOption[] =
  getRequestPurposeOptions({ includeWorkshop: false });
