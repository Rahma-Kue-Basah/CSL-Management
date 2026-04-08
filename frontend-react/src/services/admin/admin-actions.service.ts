import {
  API_AUTH_ADMIN_ACTIONS_MY,
  API_AUTH_ADMIN_ACTIONS_RECENT,
} from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type AdminAction = {
  id: number;
  action_time: string;
  action: "create" | "update" | "delete" | "unknown";
  actor: string;
  target: string;
  object_id: string;
  object_repr: string;
  change_message: string;
};

export const adminActionsService = {
  async getRecent(signal?: AbortSignal) {
    const response = await authFetch(API_AUTH_ADMIN_ACTIONS_RECENT, {
      method: "GET",
      signal,
    });
    if (!response.ok) {
      throw new Error(`Gagal memuat recent actions (${response.status})`);
    }
    const payload = (await response.json()) as AdminAction[];
    return Array.isArray(payload) ? payload : [];
  },

  async getMine(signal?: AbortSignal) {
    const response = await authFetch(API_AUTH_ADMIN_ACTIONS_MY, {
      method: "GET",
      signal,
    });
    if (!response.ok) {
      throw new Error(`Gagal memuat my actions (${response.status})`);
    }
    const payload = (await response.json()) as AdminAction[];
    return Array.isArray(payload) ? payload : [];
  },
};
