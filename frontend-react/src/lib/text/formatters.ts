export function formatRoleLabel(value: string | null | undefined) {
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function getInitialsFromNameOrEmail(
  name?: string | null,
  email?: string | null,
) {
  const source = (name || email || "U").trim();
  const parts = source.split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part[0]).join("");
  return initials.toUpperCase() || "U";
}

export function getInitialsFromText(value?: string | null, fallback = "NA") {
  const source = String(value ?? "").trim();
  if (!source) return fallback;
  return (
    source
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 3)
      .toUpperCase() || fallback
  );
}
