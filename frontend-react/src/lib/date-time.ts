const WIB_TIME_ZONE = "Asia/Jakarta";

export function toWibIsoString(value: string) {
  if (!value) return "";
  return `${value}:00+07:00`;
}

export function formatDateTimeWib(value?: string | null) {
  if (!value || value === "-") return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${formatted} WIB`;
}

export function formatLocalDateTimeAsWib(value: string) {
  if (!value) return "-";
  return formatDateTimeWib(toWibIsoString(value));
}
