"use client";

import { useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BATCH_VALUES } from "@/constants/batches";
import { DEPARTMENT_VALUES } from "@/constants/departments";
import { ROLE_FILTER_OPTIONS, ROLE_OPTIONS, normalizeRoleValue } from "@/constants/roles";
import { useCreateUser } from "@/hooks/users/use-create-user";
import {
  createEmptyUserForm,
  getVisibleUserFields,
  toCreateUserPayload,
  USER_MODAL_WIDTH_CLASS,
} from "@/components/admin/user-management/user-management-fields";

type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleParam: string | null;
  onCreated: () => void;
};

export default function CreateUserDialog({
  open,
  onOpenChange,
  roleParam,
  onCreated,
}: CreateUserDialogProps) {
  const normalizedRoleParam = (() => {
    if (!roleParam) return "";
    const normalizedRole = normalizeRoleValue(roleParam);
    return (ROLE_FILTER_OPTIONS as readonly string[]).includes(normalizedRole) ? normalizedRole : "";
  })();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState(() => createEmptyUserForm(normalizedRoleParam));
  const { createUser, isSubmitting, errorMessage, setErrorMessage } = useCreateUser();

  const visibleFields = getVisibleUserFields(form.role);

  const resetState = () => {
    setShowPassword(false);
    setEmail("");
    setPassword("");
    setForm(createEmptyUserForm(normalizedRoleParam));
    setErrorMessage("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!form.full_name.trim()) return setErrorMessage("Nama wajib diisi.");
    if (!email.trim()) return setErrorMessage("Email wajib diisi.");
    if (!password) return setErrorMessage("Password wajib diisi.");

    const result = await createUser(toCreateUserPayload({ email, password, form }) as never);
    if (!result.ok) return;

    onCreated();
    onOpenChange(false);
    resetState();
    toast.success("User berhasil dibuat.");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetState();
      }}
    >
      <DialogContent className={`${USER_MODAL_WIDTH_CLASS} [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]`}>
        <DialogHeader>
          <DialogTitle>Buat User</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Nama Lengkap</label>
              <Input
                value={form.full_name}
                onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                placeholder="Nama lengkap"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nim@student.prasetiyamulya.ac.id"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Inisial</label>
              <Input
                value={form.initials}
                onChange={(event) => setForm((prev) => ({ ...prev, initials: event.target.value.slice(0, 3) }))}
                placeholder="Opsional, 3 huruf"
                maxLength={3}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Role</label>
              <select
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...createEmptyUserForm(event.target.value), full_name: prev.full_name, initials: prev.initials }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={Boolean(normalizedRoleParam)}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value || option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {visibleFields.idNumber ? (
              <div className="space-y-1">
                <label className="text-xs font-medium">ID Number</label>
                <Input
                  value={form.id_number}
                  onChange={(event) => setForm((prev) => ({ ...prev, id_number: event.target.value }))}
                  placeholder="Nomor identitas"
                />
              </div>
            ) : null}

            {visibleFields.department ? (
              <div className="space-y-1">
                <label className="text-xs font-medium">Department</label>
                <select
                  value={form.department}
                  onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Pilih department</option>
                  {DEPARTMENT_VALUES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {visibleFields.batch ? (
              <div className="space-y-1">
                <label className="text-xs font-medium">Batch</label>
                <select
                  value={form.batch}
                  onChange={(event) => setForm((prev) => ({ ...prev, batch: event.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Pilih batch</option>
                  {BATCH_VALUES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {visibleFields.institution ? (
              <div className="space-y-1">
                <label className="text-xs font-medium">Institusi</label>
                <Input
                  value={form.institution}
                  onChange={(event) => setForm((prev) => ({ ...prev, institution: event.target.value }))}
                  placeholder="Asal institusi"
                />
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Menyimpan..." : "Buat User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
