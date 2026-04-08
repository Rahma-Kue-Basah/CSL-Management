"use client";

import { UserDetailDialog } from "@/components/admin/user-management";
import { useUserDetail } from "@/hooks/shared/resources/users";

type RelatedUserDetailDialogProps = {
  userId: string | number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function RelatedUserDetailDialog({
  userId,
  open,
  onOpenChange,
}: RelatedUserDetailDialogProps) {
  const { user, isLoading, error } = useUserDetail(open ? userId : null);

  return (
    <UserDetailDialog
      open={open}
      user={isLoading ? null : user}
      error={error}
      mode="view"
      canManageUsers={false}
      onOpenChange={onOpenChange}
      onDeleteRequest={() => undefined}
      onUserUpdated={() => undefined}
    />
  );
}
