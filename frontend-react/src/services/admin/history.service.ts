import { authFetch } from "@/lib/auth";

export type HistoryRequesterOption = {
  id: string;
  label: string;
  email: string;
  department: string;
};

type ApiHistoryRequesterOption = {
  id?: string | number | null;
  full_name?: string | null;
  email?: string | null;
  department?: string | null;
};

export const adminHistoryService = {
  async getRequesterOptions(endpoint: string, signal?: AbortSignal) {
    const response = await authFetch(endpoint, {
      method: "GET",
      signal,
    });
    if (!response.ok) {
      throw new Error(`Gagal memuat daftar pemohon (${response.status}).`);
    }

    const list = (await response.json()) as ApiHistoryRequesterOption[];
    return list
      .filter((item) => item.id)
      .map((item) => ({
        id: String(item.id),
        label: String(item.full_name ?? item.email ?? "-"),
        email: String(item.email ?? "-"),
        department: String(item.department ?? ""),
      }));
  },
};
