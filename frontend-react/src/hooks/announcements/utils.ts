"use client";

import { API_ANNOUNCEMENTS, API_BASE_URL } from "@/constants/api";

export const ANNOUNCEMENTS_ENDPOINT = API_ANNOUNCEMENTS;
export const FALLBACK_ANNOUNCEMENTS_ENDPOINT = `${API_BASE_URL}/announcements/`;

export function buildAnnouncementUrl(endpoint: string, id: string | number) {
  if (endpoint.endsWith("/")) {
    return `${endpoint}${id}/`;
  }
  return `${endpoint}/${id}/`;
}
