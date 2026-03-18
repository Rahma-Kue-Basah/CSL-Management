type StatusClassOptions = {
  bordered?: boolean;
};

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
  if (
    normalized === "in_use" ||
    normalized === "in use" ||
    normalized === "borrowed"
  ) {
    return bordered
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : "bg-indigo-100 text-indigo-700";
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
