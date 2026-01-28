const USER_TYPE_VALUES = {
  INTERNAL: "INTERNAL",
  EXTERNAL: "EXTERNAL",
};

const USER_TYPE_LABELS = {
  [USER_TYPE_VALUES.INTERNAL]: "Internal",
  [USER_TYPE_VALUES.EXTERNAL]: "External",
};

const USER_TYPE_OPTIONS = [
  { value: USER_TYPE_VALUES.INTERNAL, label: USER_TYPE_LABELS[USER_TYPE_VALUES.INTERNAL] },
  { value: USER_TYPE_VALUES.EXTERNAL, label: USER_TYPE_LABELS[USER_TYPE_VALUES.EXTERNAL] },
];

const USER_TYPE_SELECT_OPTIONS = [
  { value: "", label: "Pilih tipe" },
  ...USER_TYPE_OPTIONS,
];

const USER_TYPE_MAP = {
  internal: USER_TYPE_VALUES.INTERNAL,
  external: USER_TYPE_VALUES.EXTERNAL,
};

function normalizeUserType(value) {
  if (!value) return "";
  const raw = String(value).trim();
  const lower = raw.toLowerCase();
  if (USER_TYPE_MAP[lower]) return USER_TYPE_MAP[lower];
  const upper = raw.toUpperCase();
  return Object.values(USER_TYPE_VALUES).includes(upper) ? upper : "";
}

export {
  USER_TYPE_VALUES,
  USER_TYPE_LABELS,
  USER_TYPE_OPTIONS,
  USER_TYPE_SELECT_OPTIONS,
  USER_TYPE_MAP,
  normalizeUserType,
};
