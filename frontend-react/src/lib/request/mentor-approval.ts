import { THESIS_PURPOSE } from "@/constants/request-purpose";
import { ROLE_VALUES, normalizeRoleValue } from "@/constants/roles";
import { normalizeStatus } from "@/lib/request";

type MentorApprovalRecord = {
  purpose?: string | null;
  status?: string | null;
  requesterId?: string | null;
  requesterMentorProfileId?: string | null;
  isApprovedByMentor?: boolean | null;
  mentorApprovedAt?: string | null;
  roomPicIds?: string[] | null;
};

export function requiresMentorApproval(item: MentorApprovalRecord) {
  return (
    String(item.purpose ?? "").trim() === THESIS_PURPOSE &&
    Boolean(String(item.requesterMentorProfileId ?? "").trim())
  );
}

export function isWaitingForMentorApproval(item: MentorApprovalRecord) {
  return (
    normalizeStatus(item.status) === "pending" &&
    requiresMentorApproval(item) &&
    !Boolean(item.isApprovedByMentor)
  );
}

export function hasMentorApprovalTrace(item: MentorApprovalRecord) {
  return requiresMentorApproval(item);
}

export function getMentorApprovalStageLabel(item: MentorApprovalRecord) {
  if (!requiresMentorApproval(item)) {
    return "";
  }

  if (Boolean(item.isApprovedByMentor)) {
    return "Disetujui Dosen Pembimbing";
  }

  if (normalizeStatus(item.status) === "rejected") {
    return "Ditolak Dosen Pembimbing";
  }

  return "Menunggu Dosen Pembimbing";
}

export function canCurrentUserReviewPendingRequest(
  item: MentorApprovalRecord,
  profileId: string | number | null | undefined,
  role: string | null | undefined,
) {
  if (normalizeStatus(item.status) !== "pending") return false;

  const normalizedRole = normalizeRoleValue(role);
  const currentProfileId = String(profileId ?? "").trim();
  const requesterId = String(item.requesterId ?? "").trim();
  const mentorProfileId = String(item.requesterMentorProfileId ?? "").trim();

  if (
    normalizedRole !== ROLE_VALUES.ADMIN &&
    Boolean(currentProfileId) &&
    currentProfileId === requesterId
  ) {
    return false;
  }

  if (isWaitingForMentorApproval(item)) {
    return (
      normalizedRole === ROLE_VALUES.LECTURER &&
      Boolean(currentProfileId) &&
      currentProfileId === mentorProfileId
    );
  }

  return (
    normalizedRole === ROLE_VALUES.ADMIN ||
    normalizedRole === ROLE_VALUES.LECTURER
  );
}

export function canCurrentUserFinalizeRequest(
  item: MentorApprovalRecord,
  profileId: string | number | null | undefined,
  role: string | null | undefined,
) {
  const normalizedRole = normalizeRoleValue(role);
  const currentProfileId = String(profileId ?? "").trim();
  const requesterId = String(item.requesterId ?? "").trim();

  if (
    normalizedRole !== ROLE_VALUES.ADMIN &&
    Boolean(currentProfileId) &&
    currentProfileId === requesterId
  ) {
    return false;
  }

  if (normalizedRole === ROLE_VALUES.ADMIN) {
    return true;
  }

  if (normalizedRole !== ROLE_VALUES.LECTURER) {
    return false;
  }

  return Array.isArray(item.roomPicIds)
    ? item.roomPicIds.includes(currentProfileId)
    : false;
}
