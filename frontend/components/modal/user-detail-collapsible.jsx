"use client";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertMessage } from "@/components/ui/alert-message";
import { CheckCircle2, X, XCircle } from "lucide-react";
import {
  BadgeCheck,
  Building2,
  GraduationCap,
  IdCard,
  MailIcon,
  UserCircle,
} from "lucide-react";

function InfoRow({
  icon: Icon,
  label,
  value,
  editable = false,
  editing = false,
  name,
  onChange,
  type = "text",
  options = [],
}) {
  const showSelect = editable && editing && type === "select";
  const showInput = editable && editing && !showSelect;

  return (
    <div className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {showSelect ? (
          <select
            name={name}
            value={value || ""}
            onChange={onChange}
            disabled={!editing}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
          >
            <option value="">Pilih {label.toLowerCase()}</option>
            {options.map((opt) =>
              typeof opt === "string" ? (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ) : (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ),
            )}
          </select>
        ) : showInput ? (
          <input
            name={name}
            value={value || ""}
            onChange={onChange}
            disabled={!editing}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
          />
        ) : (
          <div className="text-sm font-medium break-words whitespace-pre-wrap leading-snug">
            {value || "—"}
          </div>
        )}
      </div>
    </div>
  );
}

export function UserDetailCollapsible({
  open,
  onOpenChange,
  selectedUser,
  initials,
  editForm,
  isPrivileged,
  isEditing,
  isUpdating,
  message,
  roleOptions,
  departmentOptions,
  batchOptions,
  onChange,
  onEditStart,
  onCancel,
  onSave,
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="fixed right-4 top-20 z-40 w-[420px] max-w-[95vw] md:right-60 data-[state=closed]:-translate-y-[320%] data-[state=open]:translate-y-0 data-[state=closed]:pointer-events-none transition-transform duration-300 ease-out"
    >
      <div className="rounded-lg border bg-card shadow-lg ring-1 ring-black/5">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">Detail User</p>
          {open ? (
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X size={16} />
            </Button>
          ) : null}
        </div>

        <CollapsibleContent asChild>
          <div className="border-t px-4 py-4 max-h-[65vh] overflow-y-auto space-y-4">
            {selectedUser ? (
              <>
                <div className="flex flex-col items-center text-center space-y-2">
                  <Avatar className="h-12 w-12 rounded-xl">
                    <AvatarFallback className="rounded-xl text-sm font-semibold">
                      {initials(selectedUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-semibold">
                      {selectedUser.name || "—"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <InfoRow
                    icon={IdCard}
                    label="ID Number"
                    value={editForm.id_number}
                    editable={isPrivileged}
                    editing={isEditing}
                    name="id_number"
                    onChange={onChange}
                  />
                  <InfoRow
                    icon={UserCircle}
                    label="Nama"
                    value={editForm.full_name}
                    editable={isPrivileged}
                    editing={isEditing}
                    name="full_name"
                    onChange={onChange}
                  />
                  <InfoRow
                    icon={GraduationCap}
                    label="Batch"
                    value={editForm.batch}
                    editable={isPrivileged}
                    editing={isEditing}
                    name="batch"
                    onChange={onChange}
                    type="select"
                    options={batchOptions}
                  />
                  <InfoRow
                    icon={Building2}
                    label="Department"
                    value={editForm.department}
                    editable={isPrivileged}
                    editing={isEditing}
                    name="department"
                    onChange={onChange}
                    type="select"
                    options={departmentOptions}
                  />
                  <InfoRow
                    icon={MailIcon}
                    label="Email"
                    value={
                      <span className="inline-flex items-center gap-1">
                        {selectedUser.email}
                        {selectedUser?.isVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </span>
                    }
                  />
                  <InfoRow
                    icon={BadgeCheck}
                    label="Role"
                    value={editForm.role}
                    editable={isPrivileged}
                    editing={isEditing}
                    name="role"
                    onChange={onChange}
                    type="select"
                    options={roleOptions}
                  />
                </div>

                {isPrivileged ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Edit Profile</p>
                      <div className="flex gap-2">
                        {isEditing ? (
                          <Button size="sm" variant="secondary" onClick={onCancel}>
                            Batal
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant={isEditing ? "default" : "outline"}
                          onClick={() => {
                            if (isEditing) {
                              onSave();
                            } else {
                              onEditStart();
                            }
                          }}
                          disabled={isUpdating}
                        >
                          {isEditing ? (isUpdating ? "Menyimpan..." : "Simpan") : "Edit"}
                        </Button>
                      </div>
                    </div>
                    {message ? (
                      <AlertMessage
                        variant={
                          message.toLowerCase().includes("fail")
                            ? "error"
                            : "success"
                        }
                      >
                        {message}
                      </AlertMessage>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Klik &quot;View Detail&quot; untuk melihat informasi.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default UserDetailCollapsible;
