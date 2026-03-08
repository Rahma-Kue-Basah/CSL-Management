import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, UserRound, XCircle } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BATCH_VALUES } from "@/constants/batches";
import { DEPARTMENT_VALUES } from "@/constants/departments";
import { ROLE_OPTIONS, normalizeRoleValue, isPrivilegedRole } from "@/constants/roles";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { useDeleteUser } from "@/hooks/users/use-delete-user";
import { useUpdateUserProfile } from "@/hooks/users/use-update-user-profile";
import { getUserInitials, useUserDetail } from "@/hooks/users/use-users";

function DetailField({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-700">{label}</label>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            editable
              ? "bg-sky-100 text-sky-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {editable ? "Editing" : "Read only"}
        </span>
      </div>
      {editable ? (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
        />
      ) : (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {value || "-"}
        </div>
      )}
    </div>
  );
}

function DetailSelect({
  label,
  value,
  editable,
  options,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-700">{label}</label>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            editable
              ? "bg-sky-100 text-sky-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {editable ? "Editing" : "Read only"}
        </span>
      </div>
      {editable ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-md border border-sky-300 bg-sky-50/60 px-3 text-sm shadow-sm outline-none focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-200"
        >
          <option value="">Pilih {label.toLowerCase()}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {value || "-"}
        </div>
      )}
    </div>
  );
}

export default function UserManagementUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = typeof location.state?.from === "string" ? location.state.from : "/admin/user-management/all";

  const { profile } = useLoadProfile();
  const canManageUsers = isPrivilegedRole(profile?.role);
  const { user, setUser, isLoading, error, setError } = useUserDetail(id);
  const { updateUserProfile, isSubmitting, message, setMessage } = useUpdateUserProfile();
  const { deleteUser, isDeleting } = useDeleteUser();

  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    role: "",
    department: "",
    batch: "",
    id_number: "",
    user_type: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      full_name: user.name || "",
      role: normalizeRoleValue(user.role || ""),
      department: user.department === "-" ? "" : user.department || "",
      batch: user.batch === "-" ? "" : user.batch || "",
      id_number: user.idNumber === "-" ? "" : user.idNumber || "",
      user_type: user.userType === "-" ? "" : user.userType || "",
    });
    setIsEditing(false);
    setMessage("");
  }, [setMessage, user]);

  const handleSave = async () => {
    if (!user?.profileId) {
      setError("Profile ID tidak ditemukan.");
      return;
    }

    try {
      const updated = await updateUserProfile(user.profileId, {
        full_name: form.full_name,
        role: form.role || null,
        department: form.department || null,
        batch: form.batch || null,
        id_number: form.id_number || null,
        user_type: form.user_type || null,
      });

      setUser({
        ...user,
        name: String(updated.full_name || form.full_name || user.name),
        role: normalizeRoleValue(String(updated.role || form.role || "")) || "-",
        department: String(updated.department || form.department || "-"),
        batch: String(updated.batch || form.batch || "-"),
        idNumber: String(updated.id_number || form.id_number || "-"),
        userType: String(updated.user_type || form.user_type || "-"),
      });
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal update user.");
    }
  };

  const handleDelete = async () => {
    if (!user?.id) return;

    const result = await deleteUser(user.id);
    if (!result.ok) {
      setError(result.message || "Gagal menghapus user.");
      return;
    }

    setConfirmDeleteOpen(false);
    navigate(backTo, { replace: true });
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      {error ? (
        <div className="mx-auto max-w-3xl rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card px-4 py-10">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Memuat detail user...</span>
          </div>
        </div>
      ) : !user ? (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
          Data user tidak ditemukan.
        </div>
      ) : (
        <div className="mx-auto max-w-3xl rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">Detail User</p>
              </div>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={() => navigate(backTo)}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>

          <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-semibold uppercase">
                {getUserInitials(user)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                  user.isVerified
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "bg-red-500/10 text-red-700"
                }`}
              >
                {user.isVerified ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {user.isVerified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <DetailField
              label="Nama"
              value={form.full_name}
              editable={isEditing && canManageUsers}
              onChange={(value) => setForm((prev) => ({ ...prev, full_name: value }))}
            />
            <DetailField label="Email" value={user.email} editable={false} onChange={() => undefined} />
            <DetailSelect
              label="Role"
              value={form.role}
              editable={isEditing && canManageUsers}
              options={ROLE_OPTIONS.filter((opt) => opt.value).map((opt) => ({ value: opt.value, label: opt.label }))}
              onChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
            />
            <DetailSelect
              label="Department"
              value={form.department}
              editable={isEditing && canManageUsers}
              options={DEPARTMENT_VALUES.map((value) => ({ value, label: value }))}
              onChange={(value) => setForm((prev) => ({ ...prev, department: value }))}
            />
            <DetailSelect
              label="Batch"
              value={form.batch}
              editable={isEditing && canManageUsers}
              options={BATCH_VALUES.map((value) => ({ value, label: value }))}
              onChange={(value) => setForm((prev) => ({ ...prev, batch: value }))}
            />
            <DetailField
              label="ID Number"
              value={form.id_number}
              editable={isEditing && canManageUsers}
              onChange={(value) => setForm((prev) => ({ ...prev, id_number: value }))}
            />
            <DetailField label="User Type" value={user.userType} editable={false} onChange={() => undefined} />
          </div>

          {message ? (
            <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">{message}</div>
          ) : null}

          {canManageUsers ? (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  className="sm:min-w-32"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
              ) : null}
              <Button
                type="button"
                variant={isEditing ? "default" : "outline"}
                className={isEditing ? "bg-[#0052C7] text-white hover:bg-[#0048B4] sm:min-w-32" : "sm:min-w-32"}
                onClick={() => {
                  if (isEditing) {
                    void handleSave();
                    return;
                  }
                  setIsEditing(true);
                }}
                disabled={isSubmitting}
              >
                {isEditing ? (isSubmitting ? "Menyimpan..." : "Simpan") : "Edit"}
              </Button>

              {!isEditing ? (
                <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" className="sm:min-w-32" disabled={isDeleting}>
                      {isDeleting ? "Menghapus..." : "Hapus User"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent size="sm">
                    <AlertDialogHeader className="place-items-start text-left">
                      <AlertDialogTitle>Hapus user?</AlertDialogTitle>
                      <AlertDialogDescription>
                        User <span className="font-semibold">{user.name || user.email}</span> akan dihapus permanen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-start">
                      <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={() => {
                          void handleDelete();
                        }}
                      >
                        {isDeleting ? "Menghapus..." : "Hapus"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
