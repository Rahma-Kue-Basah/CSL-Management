export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function toStartOfDay(value: string) {
  return value ? `${value}T00:00:00` : "";
}

export function toEndOfDay(value: string) {
  return value ? `${value}T23:59:59` : "";
}

export function getDateKeyFromValue(value?: string | null) {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toISOString().slice(0, 10);
}
