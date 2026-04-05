"use client";

import { useEffect, useState } from "react";

import {
  API_AUTH_PIC_USERS,
  API_AUTH_PIC_USERS_BULK_REMOVE_ASSIGNMENTS,
  API_AUTH_PIC_USER_REMOVE_ASSIGNMENTS,
} from "@/constants/api";
import { normalizeRoleValue } from "@/constants/roles";
import { authFetch } from "@/lib/auth";
import type { UserRow } from "@/hooks/users/use-users";

export type RoomPicTaskUserRow = UserRow & {
  roomNames?: string[];
};

type ApiRoomPicUser = {
  id?: string | number | null;
  email?: string | null;
  profile_id?: string | null;
  full_name?: string | null;
  role?: string | null;
  department?: string | null;
  id_number?: string | null;
  room_names?: string[] | null;
  is_mentor?: boolean | null;
};

type UseRoomPicTaskUsersFilters = {
  department?: string;
  role?: string;
  room?: string;
  search?: string;
};

function mapRoomPicUser(item: ApiRoomPicUser): RoomPicTaskUserRow {
  const rawId = item.id ?? item.email ?? "user";

  return {
    id: rawId,
    uid: rawId,
    profileId: item.profile_id ?? null,
    name: String(item.full_name ?? item.email ?? "-"),
    initials: "",
    email: String(item.email ?? "-"),
    role: normalizeRoleValue(item.role) || "-",
    isMentor: Boolean(item.is_mentor),
    userType: "-",
    batch: "-",
    department: String(item.department ?? "-"),
    idNumber: String(item.id_number ?? "-"),
    institution: "-",
    isVerified: false,
    roomNames: Array.isArray(item.room_names)
      ? item.room_names.map((name) => String(name)).filter(Boolean)
      : [],
  };
}

export function useRoomPicTaskUsers(
  filters: UseRoomPicTaskUsersFilters = {},
  reloadKey = 0,
) {
  const [users, setUsers] = useState<RoomPicTaskUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isAborted = false;

    const loadUsers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const url = new URL(API_AUTH_PIC_USERS, window.location.origin);
        url.searchParams.set("assigned_only", "true");
        if (filters.department) url.searchParams.set("department", filters.department);
        if (filters.role) url.searchParams.set("role", filters.role);
        if (filters.room) url.searchParams.set("room", filters.room);
        if (filters.search) url.searchParams.set("search", filters.search);

        const response = await authFetch(url.toString(), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat data PIC ruangan (${response.status})`);
        }

        const payload = (await response.json()) as ApiRoomPicUser[];
        setUsers(payload.map(mapRoomPicUser));
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Terjadi kesalahan saat memuat PIC ruangan.",
        );
      } finally {
        if (isAborted || controller.signal.aborted) return;
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    };

    void loadUsers();

    return () => {
      isAborted = true;
      controller.abort();
    };
  }, [filters.department, filters.role, filters.room, filters.search, reloadKey]);

  return {
    users,
    setUsers,
    totalCount: users.length,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  };
}

export async function removeRoomPicAssignments(userId: string | number) {
  const response = await authFetch(API_AUTH_PIC_USER_REMOVE_ASSIGNMENTS(userId), {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Gagal melepas PIC ruangan (${response.status})`);
  }

  return (await response.json()) as { removed_count?: number };
}

export async function bulkRemoveRoomPicAssignments(ids: Array<number | string>) {
  const numericIds = ids
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  const response = await authFetch(API_AUTH_PIC_USERS_BULK_REMOVE_ASSIGNMENTS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: numericIds }),
  });

  if (!response.ok) {
    throw new Error(`Gagal melepas PIC ruangan terpilih (${response.status})`);
  }

  return (await response.json()) as {
    removed_count?: number;
    failed_count?: number;
    removed_ids?: Array<number | string>;
    failed_ids?: Array<number | string>;
  };
}
