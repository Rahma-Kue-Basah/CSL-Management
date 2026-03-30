import type { ProgressStepItem } from "@/components/shared/progress-steps";
import { formatDateTimeWib } from "@/lib/date-format";

type BasicProgressInput = {
  status: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  expiredAt?: string;
  completedAt?: string;
};

type BorrowProgressInput = BasicProgressInput & {
  endTimeActual: string;
  borrowedAt?: string;
  returnedPendingInspectionAt?: string;
  inspectedAt?: string;
  returnedAt?: string;
  overdueAt?: string;
  lostDamagedAt?: string;
};

function normalizeStatus(value: string) {
  return value.toLowerCase();
}

function pickTime(...values: Array<string | undefined>) {
  const found = values.find((value) => value && value !== "-");
  return found ? formatDateTimeWib(found) : undefined;
}

export function getBookingProgressFlow(
  booking: BasicProgressInput,
): ProgressStepItem[] {
  const status = normalizeStatus(booking.status);

  const baseSteps: ProgressStepItem[] = [
    {
      key: "submitted",
      label: "Diajukan",
      time: formatDateTimeWib(booking.createdAt),
      state: "finish",
    },
    {
      key: "approved",
      label: "Disetujui",
      state: "wait",
    },
    {
      key: "completed",
      label: "Selesai",
      state: "wait",
    },
  ];

  if (status === "pending") return baseSteps;
  if (status === "approved") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = pickTime(booking.approvedAt, booking.updatedAt);
    baseSteps[2].state = "process";
    return baseSteps;
  }
  if (status === "completed") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = pickTime(booking.approvedAt, booking.updatedAt);
    baseSteps[2].state = "finish";
    baseSteps[2].time = pickTime(booking.completedAt, booking.updatedAt);
    return baseSteps;
  }
  if (status === "rejected") {
    baseSteps[1] = {
      key: "rejected",
      label: "Ditolak",
      time: pickTime(booking.rejectedAt, booking.updatedAt),
      state: "error",
    };
    return baseSteps.slice(0, 2);
  }
  if (status === "expired") {
    baseSteps[1] = {
      key: "expired",
      label: "Kedaluwarsa",
      time: pickTime(booking.expiredAt, booking.updatedAt),
      state: "error",
    };
    return baseSteps.slice(0, 2);
  }
  return baseSteps;
}

export function getUseProgressFlow(item: BasicProgressInput): ProgressStepItem[] {
  return getBookingProgressFlow(item);
}

export function getPengujianProgressFlow(
  item: BasicProgressInput,
): ProgressStepItem[] {
  return getBookingProgressFlow(item);
}

export function getBorrowProgressFlow(
  item: BorrowProgressInput,
): ProgressStepItem[] {
  const status = normalizeStatus(item.status);

  const baseSteps: ProgressStepItem[] = [
    {
      key: "submitted",
      label: "Diajukan",
      time: formatDateTimeWib(item.createdAt),
      state: "finish",
    },
    {
      key: "approved",
      label: "Disetujui",
      state: "wait",
    },
    {
      key: "borrowed",
      label: "Dipinjam",
      state: "wait",
    },
    {
      key: "returned",
      label: "Diterima Kembali",
      state: "wait",
    },
    {
      key: "inspection",
      label: "Inspeksi",
      state: "wait",
    },
    {
      key: "completed",
      label: "Selesai",
      state: "wait",
    },
  ];

  if (status === "pending") return baseSteps;
  if (status === "approved") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = pickTime(item.approvedAt, item.updatedAt);
    baseSteps[2].state = "process";
    return baseSteps;
  }
  if (status === "borrowed") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = pickTime(item.approvedAt, item.updatedAt);
    baseSteps[2].state = "finish";
    baseSteps[2].time = pickTime(item.borrowedAt, item.updatedAt);
    baseSteps[3].state = "process";
    return baseSteps;
  }
  if (
    status === "returned pending inspection" ||
    status === "returned_pending_inspection"
  ) {
    baseSteps[1].state = "finish";
    baseSteps[1].time = pickTime(item.approvedAt, item.updatedAt);
    baseSteps[2].state = "finish";
    baseSteps[2].time = pickTime(item.borrowedAt, item.updatedAt);
    baseSteps[3].state = "finish";
    baseSteps[3].time = pickTime(
      item.returnedPendingInspectionAt,
      item.endTimeActual,
      item.updatedAt,
    );
    baseSteps[4].state = "process";
    return baseSteps;
  }
  if (status === "returned") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = pickTime(item.approvedAt, item.updatedAt);
    baseSteps[2].state = "finish";
    baseSteps[2].time = pickTime(item.borrowedAt, item.updatedAt);
    baseSteps[3].state = "finish";
    baseSteps[3].time = pickTime(
      item.returnedPendingInspectionAt,
      item.endTimeActual,
      item.updatedAt,
    );
    baseSteps[4].state = "finish";
    baseSteps[4].time = pickTime(item.inspectedAt, item.updatedAt);
    baseSteps[5].state = "finish";
    baseSteps[5].time = pickTime(item.returnedAt, item.inspectedAt, item.updatedAt);
    return baseSteps;
  }
  if (status === "rejected") {
    baseSteps[1] = {
      key: "rejected",
      label: "Ditolak",
      time: pickTime(item.rejectedAt, item.updatedAt),
      state: "error",
    };
    return baseSteps.slice(0, 2);
  }
  if (status === "expired") {
    baseSteps[1] = {
      key: "expired",
      label: "Expired",
      time: pickTime(item.expiredAt, item.updatedAt),
      state: "error",
    };
    return baseSteps.slice(0, 2);
  }
  if (status === "overdue") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = pickTime(item.approvedAt, item.updatedAt);
    baseSteps[2].state = "finish";
    baseSteps[2].time = pickTime(item.borrowedAt, item.updatedAt);
    baseSteps[3] = {
      key: "overdue",
      label: "Terlambat",
      time: pickTime(item.overdueAt, item.updatedAt),
      state: "error",
    };
    return baseSteps.slice(0, 4);
  }
  if (status === "lost/damaged") {
    baseSteps[1].state = "finish";
    baseSteps[1].time = pickTime(item.approvedAt, item.updatedAt);
    baseSteps[2].state = "finish";
    baseSteps[2].time = pickTime(item.borrowedAt, item.updatedAt);
    baseSteps[3].state = "finish";
    baseSteps[3].time = pickTime(
      item.returnedPendingInspectionAt,
      item.endTimeActual,
      item.updatedAt,
    );
    baseSteps[4] = {
      key: "lost-damaged",
      label: "Hilang/Rusak",
      time: pickTime(item.lostDamagedAt, item.inspectedAt, item.updatedAt),
      state: "error",
    };
    return baseSteps.slice(0, 5);
  }

  return baseSteps;
}
