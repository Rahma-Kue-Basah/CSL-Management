"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { UserRow } from "@/hooks/users/use-users";
import { useDeleteUser } from "@/hooks/users/use-delete-user";
import type { UserDetailMode } from "@/components/admin/user-management/user-management-fields";

type DetailState = {
  user: UserRow | null;
  mode: UserDetailMode;
};

type UseUserManagementActionsArgs = {
  canManageUsers: boolean;
  users: UserRow[];
  setUsers: React.Dispatch<React.SetStateAction<UserRow[]>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
};

export function useUserManagementActions({
  canManageUsers,
  users,
  setUsers,
  setTotalCount,
  setError,
}: UseUserManagementActionsArgs) {
  const [deleteCandidate, setDeleteCandidate] = useState<UserRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [detailState, setDetailState] = useState<DetailState>({
    user: null,
    mode: "view",
  });

  const { deleteUser, deleteUsers, isDeleting } = useDeleteUser();

  const selectedCount = selectedIds.length;
  const allVisibleSelected =
    canManageUsers &&
    users.length > 0 &&
    users.every((user) => selectedIds.includes(user.id));
  const someVisibleSelected =
    canManageUsers &&
    users.some((user) => selectedIds.includes(user.id)) &&
    !allVisibleSelected;

  const deletedIdSet = useMemo(
    () => new Set(selectedIds.map((id) => String(id))),
    [selectedIds],
  );

  const selectedRows = useMemo(
    () => users.filter((user) => deletedIdSet.has(String(user.id))),
    [deletedIdSet, users],
  );

  const openDetail = (user: UserRow, mode: UserDetailMode = "view") => {
    setDetailState({ user, mode });
  };

  const closeDetail = () => {
    setDetailState({ user: null, mode: "view" });
  };

  const toggleItemSelection = (id: number | string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((prev) =>
        prev.filter((id) => !users.some((user) => String(user.id) === String(id))),
      );
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      users.forEach((user) => next.add(user.id));
      return Array.from(next);
    });
  };

  const syncSelectionWithUsers = (nextUsers: UserRow[]) => {
    setSelectedIds((prev) =>
      prev.filter((id) => nextUsers.some((user) => String(user.id) === String(id))),
    );
  };

  const handleDelete = async () => {
    if (!canManageUsers || !deleteCandidate?.id) return;

    const result = await deleteUser(deleteCandidate.id);
    if (!result.ok) {
      setError(result.message || "Gagal menghapus user.");
      return;
    }

    setUsers((prev) => prev.filter((item) => String(item.id) !== String(deleteCandidate.id)));
    setTotalCount((prev) => Math.max(0, prev - 1));
    setSelectedIds((prev) => prev.filter((id) => String(id) !== String(deleteCandidate.id)));
    if (detailState.user && String(detailState.user.id) === String(deleteCandidate.id)) {
      closeDetail();
    }
    setDeleteCandidate(null);
    toast.success("User berhasil dihapus.");
  };

  const handleBulkDelete = async () => {
    if (!canManageUsers || !selectedIds.length) return;

    const result = await deleteUsers(selectedIds);
    if (!result.ok) {
      setError(result.message || "Gagal menghapus user terpilih.");
      toast.error(result.message || "Gagal menghapus user terpilih.");
      return;
    }

    const removedIds = new Set((result.deletedIds ?? []).map((id) => String(id)));
    if (removedIds.size > 0) {
      setUsers((prev) => prev.filter((item) => !removedIds.has(String(item.id))));
      setTotalCount((prev) => Math.max(0, prev - removedIds.size));
      setSelectedIds((prev) => prev.filter((id) => !removedIds.has(String(id))));
      if (detailState.user && removedIds.has(String(detailState.user.id))) {
        closeDetail();
      }
    }

    setIsBulkDeleteOpen(false);

    if ((result.failedCount ?? 0) > 0) {
      toast.warning(
        `${result.deletedCount ?? 0} user berhasil dihapus, ${result.failedCount ?? 0} gagal.`,
      );
      return;
    }

    toast.success(`${result.deletedCount ?? 0} user berhasil dihapus.`);
  };

  return {
    deleteCandidate,
    setDeleteCandidate,
    detailState,
    openDetail,
    closeDetail,
    selectedIds,
    setSelectedIds,
    selectedRows,
    selectedCount,
    allVisibleSelected,
    someVisibleSelected,
    toggleItemSelection,
    toggleSelectAllVisible,
    syncSelectionWithUsers,
    isBulkDeleteOpen,
    setIsBulkDeleteOpen,
    handleDelete,
    handleBulkDelete,
    isDeleting,
  };
}

export default useUserManagementActions;
