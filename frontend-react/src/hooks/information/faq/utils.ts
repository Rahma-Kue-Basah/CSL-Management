"use client";

import { API_FAQS, API_FAQS_BULK_DELETE } from "@/constants/api";

export const FAQS_ENDPOINT = API_FAQS;
export const FAQS_BULK_DELETE_ENDPOINT = API_FAQS_BULK_DELETE;

export function buildFaqUrl(endpoint: string, id: string | number) {
  return `${endpoint}${id}/`;
}
