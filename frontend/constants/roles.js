const ROLE_VALUES = {
  STUDENT: "STUDENT",
  LECTURER: "LECTURER",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  OTHER: "OTHER",
  SUPER_ADMINISTRATOR: "SUPER_ADMINISTRATOR",
  SUPERADMINISTRATOR: "SUPERADMINISTRATOR",
};

const ROLE_LABELS = {
  [ROLE_VALUES.STUDENT]: "Student",
  [ROLE_VALUES.LECTURER]: "Lecturer",
  [ROLE_VALUES.ADMIN]: "Admin",
  [ROLE_VALUES.STAFF]: "Staff",
  [ROLE_VALUES.OTHER]: "Other",
};

const ROLE_OPTIONS = [
  { value: "", label: "Pilih role" },
  { value: ROLE_VALUES.STUDENT, label: ROLE_LABELS[ROLE_VALUES.STUDENT] },
  { value: ROLE_VALUES.LECTURER, label: ROLE_LABELS[ROLE_VALUES.LECTURER] },
  { value: ROLE_VALUES.ADMIN, label: ROLE_LABELS[ROLE_VALUES.ADMIN] },
  { value: ROLE_VALUES.STAFF, label: ROLE_LABELS[ROLE_VALUES.STAFF] },
  { value: ROLE_VALUES.OTHER, label: ROLE_LABELS[ROLE_VALUES.OTHER] },
];

const ROLE_FILTER_OPTIONS = [
  ROLE_LABELS[ROLE_VALUES.STUDENT],
  ROLE_LABELS[ROLE_VALUES.LECTURER],
  ROLE_LABELS[ROLE_VALUES.ADMIN],
  ROLE_LABELS[ROLE_VALUES.STAFF],
  ROLE_LABELS[ROLE_VALUES.OTHER],
];

const ROLE_MAP = {
  student: ROLE_VALUES.STUDENT,
  lecturer: ROLE_VALUES.LECTURER,
  admin: ROLE_VALUES.ADMIN,
  staff: ROLE_VALUES.STAFF,
  other: ROLE_VALUES.OTHER,
};

function normalizeRoleInput(value) {
  if (!value) return "";
  const raw = String(value).trim();
  const lower = raw.toLowerCase();
  if (ROLE_MAP[lower]) return ROLE_MAP[lower];
  const upper = raw.toUpperCase();
  return Object.values(ROLE_VALUES).includes(upper) ? upper : "";
}

function isPrivilegedRole(role) {
  if (!role) return false;
  const normalized = String(role).toUpperCase();
  return (
    normalized === ROLE_VALUES.ADMIN ||
    normalized === ROLE_VALUES.SUPER_ADMINISTRATOR ||
    normalized === ROLE_VALUES.SUPERADMINISTRATOR
  );
}

export {
  ROLE_VALUES,
  ROLE_LABELS,
  ROLE_OPTIONS,
  ROLE_FILTER_OPTIONS,
  ROLE_MAP,
  normalizeRoleInput,
  isPrivilegedRole,
};
