import {
  API_ANNOUNCEMENTS,
  API_ANNOUNCEMENTS_BULK_DELETE,
} from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type Announcement = {
  id: string | number;
  title: string;
  content: string;
  created_by?: string | number | null;
  created_at?: string | null;
};

export type AnnouncementFilters = {
  search?: string;
  ordering?: "created_at" | "-created_at";
  date?: string;
};

type AnnouncementListResponse = {
  count?: number;
  results?: Announcement[];
};

type MutationResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; data?: unknown; text?: string };

async function parseMutationResponse(response: Response): Promise<MutationResult> {
  const raw = await response.text();
  let data: unknown;

  if (raw) {
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      data = undefined;
    }
  }

  if (response.ok) {
    return { ok: true, data };
  }

  return { ok: false, status: response.status, data, text: raw || undefined };
}

export const announcementsService = {
  async getList(
    page = 1,
    pageSize = 10,
    filters: AnnouncementFilters = {},
    signal?: AbortSignal,
  ) {
    const url = new URL(API_ANNOUNCEMENTS, window.location.origin);
    url.searchParams.set("page", String(page));
    url.searchParams.set("page_size", String(pageSize));
    if (filters.search) url.searchParams.set("search", filters.search);
    if (filters.ordering) url.searchParams.set("ordering", filters.ordering);
    if (filters.date) url.searchParams.set("date", filters.date);

    const response = await authFetch(url.toString(), { signal });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const detail =
        typeof (errorPayload as { detail?: string })?.detail === "string"
          ? (errorPayload as { detail?: string }).detail
          : "Gagal memuat pengumuman.";
      throw new Error(detail || "Gagal memuat pengumuman.");
    }

    return (await response.json().catch(() => null)) as
      | AnnouncementListResponse
      | Announcement[]
      | null;
  },

  async create(payload: { title: string; content: string }) {
    const response = await authFetch(API_ANNOUNCEMENTS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return parseMutationResponse(response);
  },

  async update(id: string | number, payload: { title: string; content: string }) {
    const response = await authFetch(`${API_ANNOUNCEMENTS}${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return parseMutationResponse(response);
  },

  async remove(id: string | number) {
    const response = await authFetch(`${API_ANNOUNCEMENTS}${id}/`, {
      method: "DELETE",
    });

    return parseMutationResponse(response);
  },

  async bulkRemove(ids: Array<string | number>) {
    const response = await authFetch(API_ANNOUNCEMENTS_BULK_DELETE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    return parseMutationResponse(response);
  },
};
