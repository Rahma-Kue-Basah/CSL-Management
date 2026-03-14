"use client";

import { API_FAQS } from "@/constants/api";

export const FAQS_ENDPOINT = API_FAQS;

export function buildFaqUrl(endpoint: string, id: string | number) {
  return `${endpoint}${id}/`;
}
