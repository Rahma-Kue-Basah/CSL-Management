const USER_TYPE_VALUES = {
  INTERNAL: "Internal",
  EXTERNAL: "External",
} as const;

const USER_TYPE_LABELS = {
  [USER_TYPE_VALUES.INTERNAL]: "Internal",
  [USER_TYPE_VALUES.EXTERNAL]: "External",
} as const;

export { USER_TYPE_VALUES, USER_TYPE_LABELS };
