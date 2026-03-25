type StatusClassOptions = {
  bordered?: boolean;
};

export type StatusSummaryTone =
  | "slate"
  | "blue"
  | "amber"
  | "emerald"
  | "sky"
  | "rose";

export type StatusOption = {
  value: string;
  label: string;
};

export const REQUEST_STATUS_OPTIONS: StatusOption[] = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "completed", label: "Completed" },
];

export const BORROW_STATUS_OPTIONS: StatusOption[] = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "borrowed", label: "Borrowed" },
  { value: "returned_pending_inspection", label: "Returned Pending Inspection" },
  { value: "returned", label: "Returned" },
  { value: "overdue", label: "Overdue" },
  { value: "lost_damaged", label: "Lost/Damaged" },
];

export const SAMPLE_TESTING_STATUS_OPTIONS: StatusOption[] = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
];

export function normalizeStatus(status?: string | null) {
  return String(status ?? "").trim().toLowerCase();
}

export function getStatusBadgeClass(
  status?: string | null,
  options: StatusClassOptions = {},
) {
  const normalized = normalizeStatus(status);
  const bordered = options.bordered ?? false;

  if (normalized === "approved") {
    return bordered
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "bg-emerald-100 text-emerald-700";
  }
  if (normalized === "pending") {
    return bordered
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "bg-amber-100 text-amber-700";
  }
  if (normalized === "completed" || normalized === "returned") {
    return bordered
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : "bg-sky-100 text-sky-700";
  }
  if (normalized === "borrowed") {
    return bordered
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : "bg-indigo-100 text-indigo-700";
  }
  if (normalized === "returned pending inspection" || normalized === "returned_pending_inspection") {
    return bordered
      ? "border-cyan-200 bg-cyan-50 text-cyan-700"
      : "bg-cyan-100 text-cyan-700";
  }
  if (normalized === "overdue") {
    return bordered
      ? "border-orange-200 bg-orange-50 text-orange-700"
      : "bg-orange-100 text-orange-700";
  }
  if (normalized === "expired") {
    return bordered
      ? "border-zinc-200 bg-zinc-50 text-zinc-700"
      : "bg-zinc-200 text-zinc-700";
  }
  if (normalized === "lost_damaged") {
    return bordered
      ? "border-red-200 bg-red-50 text-red-700"
      : "bg-red-100 text-red-700";
  }
  if (normalized === "rejected") {
    return bordered
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "bg-rose-100 text-rose-700";
  }

  return bordered
    ? "border-slate-200 bg-slate-50 text-slate-700"
    : "bg-slate-100 text-slate-600";
}

export function getStatusSummaryTone(status?: string | null): StatusSummaryTone {
  const normalized = normalizeStatus(status);

  if (normalized === "approved") return "emerald";
  if (normalized === "pending") return "amber";
  if (normalized === "returned pending inspection" || normalized === "returned_pending_inspection") {
    return "blue";
  }
  if (normalized === "completed" || normalized === "returned") return "sky";
  if (normalized === "rejected" || normalized === "lost_damaged") return "rose";
  if (normalized === "expired" || normalized === "overdue") return "slate";

  return "blue";
}

export function getStatusDisplayLabel(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "pending") return "Pending";
  if (normalized === "approved") return "Approved";
  if (normalized === "completed") return "Completed";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "expired") return "Expired";
  if (normalized === "borrowed") return "Borrowed";
  if (normalized === "returned pending inspection" || normalized === "returned_pending_inspection") {
    return "Returned Pending Inspection";
  }
  if (normalized === "returned") return "Returned";
  if (normalized === "overdue") return "Overdue";
  if (normalized === "lost_damaged") return "Lost/Damaged";

  return String(status ?? "").trim() || "-";
}
