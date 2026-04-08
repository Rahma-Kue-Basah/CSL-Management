"use client";

import type { ReactNode } from "react";
import { Building2, Mail, Shield, UserRound } from "lucide-react";

import { AdminDetailDialogShell } from "@/components/shared";
import { getUserInitials } from "@/hooks/shared/resources/users";
import type { RoomPicTaskUserRow } from "@/hooks/shared/resources/users";
import { USER_MODAL_WIDTH_CLASS } from "@/components/admin/user-management";

type RoomPicDetailDialogProps = {
  open: boolean;
  user: RoomPicTaskUserRow | null;
  onOpenChange: (open: boolean) => void;
};

export default function RoomPicDetailDialog({
  open,
  user,
  onOpenChange,
}: RoomPicDetailDialogProps) {
  return (
    <AdminDetailDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Detail PIC Ruangan"
      description="Tinjau informasi user dan daftar ruangan yang sedang ditangani."
      icon={<Building2 className="h-5 w-5" />}
      contentClassName={`${USER_MODAL_WIDTH_CLASS} gap-0 p-0 [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]`}
    >
      {user ? (
        <div className="space-y-5 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-semibold uppercase">
              {getUserInitials(user)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailBlock
              icon={<Shield className="h-4 w-4" />}
              label="Role"
              value={user.role || "-"}
            />
            <DetailBlock
              icon={<UserRound className="h-4 w-4" />}
              label="Department"
              value={user.department || "-"}
            />
            <DetailBlock
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={user.email || "-"}
              className="md:col-span-2"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">Ruangan Ditugaskan</p>
            {user.roomNames?.length ? (
              <div className="flex flex-wrap gap-2">
                {user.roomNames.map((roomName) => (
                  <span
                    key={roomName}
                    className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900"
                  >
                    {roomName}
                  </span>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-muted-foreground">
                User ini belum ditugaskan ke ruangan mana pun.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AdminDetailDialogShell>
  );
}

function DetailBlock({
  icon,
  label,
  value,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 ${className}`}>
      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <p className="break-words text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
