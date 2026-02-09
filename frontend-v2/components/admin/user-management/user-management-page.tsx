"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileDown,
  FileUp,
  Loader2,
  Plus,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
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
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { BATCH_OPTIONS, BATCH_VALUES } from "@/constants/batches";
import { DEPARTMENT_VALUES } from "@/constants/departments";
import {
  ROLE_FILTER_OPTIONS,
  ROLE_OPTIONS,
  isPrivilegedRole,
} from "@/constants/roles";
import { USER_TYPE_VALUES } from "@/constants/user-types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBulkCreateUsers, type BulkRow } from "@/hooks/users/use-bulk-create-users";
import { useCreateUser } from "@/hooks/users/use-create-user";
import { useDeleteUser } from "@/hooks/users/use-delete-user";
import { useUpdateUserProfile } from "@/hooks/users/use-update-user-profile";
import {
  getUserInitials,
  type UserRow,
  useUsers,
} from "@/hooks/users/use-users";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";

type FiltersState = {
  department: string;
  role: string;
  batch: string;
};

type ActionType = "create" | "bulk" | "detail";

const PAGE_SIZE = 10;
const HEADER_MAP: Record<string, keyof Pick<BulkRow, "full_name" | "email" | "password" | "role">> = {
  "nama lengkap": "full_name",
  nama: "full_name",
  "full name": "full_name",
  fullname: "full_name",
  email: "email",
  password: "password",
  role: "role",
};

function normalizeHeader(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildTemplateWorkbook(hasRoleScope: boolean) {
  const headers = hasRoleScope
    ? ["nama lengkap", "email", "password"]
    : ["nama lengkap", "email", "password", "role"];
  const sample = [
    [
      "Aziz Rahmad",
      "aziz@student.prasetiyamulya.ac.id",
      "Password123",
      ...(hasRoleScope ? [] : ["STUDENT"]),
    ],
  ];
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Users");
  return workbook;
}

type UserManagementPageProps = {
  forcedRole?: string;
};

export default function UserManagementPage({ forcedRole }: UserManagementPageProps) {
  const searchParams = useSearchParams();
  const roleParam = forcedRole ?? searchParams.get("role");
  const isRoleScoped = Boolean(roleParam);

  const { profile } = useLoadProfile();
  const canManageUsers = isPrivilegedRole(profile?.role);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<FiltersState>({
    department: "",
    role: "",
    batch: "",
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<UserRow | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const isMobile = useIsMobile();

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      role: roleParam ? roleParam.toUpperCase() : filters.role,
    }),
    [filters, roleParam],
  );

  const {
    users,
    setUsers,
    totalCount,
    setTotalCount,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  } = useUsers(
    page,
    PAGE_SIZE,
    {
      ...effectiveFilters,
      search: debouncedSearch,
    },
    reloadKey,
  );
  const { deleteUser, isDeleting } = useDeleteUser();

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const totalUsers = totalCount || users.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || users.length) / PAGE_SIZE)),
    [totalCount, users.length],
  );
  const visiblePages = useMemo(() => {
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [page, totalPages]);
  const columnCount = isRoleScoped ? 6 : 7;
  const isActionOpen = activeAction !== null;

  const handleDelete = async () => {
    if (!canManageUsers || !deleteCandidate?.id) return;
    const result = await deleteUser(deleteCandidate.id);
    if (!result.ok) {
      setError(result.message || "Gagal menghapus user.");
      return;
    }

    setUsers((prev) => prev.filter((item) => item.id !== deleteCandidate.id));
    setTotalCount((prev) => Math.max(0, prev - 1));
    if (selectedUser?.id === deleteCandidate.id) {
      setSelectedUser(null);
      if (activeAction === "detail") setActiveAction(null);
    }
    setDeleteCandidate(null);
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilters({ department: "", role: "", batch: "" });
    setPage(1);
  };

  const panelCallbacks = {
    onClose: () => setActiveAction(null),
    onRefresh: () => setReloadKey((prev) => prev + 1),
    onSelectUser: (user: UserRow | null) => setSelectedUser(user),
    onUsersPatch: setUsers,
    onTotalCountChange: setTotalCount,
    onError: setError,
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <div className="flex min-w-0 items-start gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <AdminPageHeader
            title="User Management"
            description={`Total ${totalUsers} user terdaftar.`}
            icon={<UserPlus className="h-5 w-5 text-sky-200" />}
            actions={
              canManageUsers ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => setActiveAction("bulk")}
                  >
                    <FileUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-white text-slate-900 hover:bg-slate-100"
                    onClick={() => setActiveAction("create")}
                  >
                    <Plus className="h-4 w-4" />
                    Buat User
                  </Button>
                </>
              ) : null
            }
          />

          {!isRoleScoped ? (
            <div className="w-full min-w-0 rounded border border-slate-300/70 bg-slate-100 shadow-xs">
              <div
                className="flex cursor-pointer items-center justify-between px-4 py-3"
                onClick={() => setFilterOpen((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setFilterOpen((prev) => !prev);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-white/90 p-2 text-slate-700 shadow-xs">
                    <SlidersHorizontal className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Filter User</p>
                </div>
                {filterOpen ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 border-slate-300 bg-white/90 text-slate-900 hover:bg-white"
                    onClick={(event) => {
                      event.stopPropagation();
                      resetFilters();
                      setFilterOpen(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                    Reset
                  </Button>
                ) : null}
              </div>

              {filterOpen ? (
                <div className="border-t border-slate-300/70 px-4 pb-4 pt-3">
                  <form
                    className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setPage(1);
                    }}
                  >
                    <div className="min-w-0">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
                        Cari
                      </label>
                      <Input
                        type="search"
                        value={search}
                        placeholder="Nama, email, atau ID"
                        className="border-slate-300 bg-white shadow-xs focus-visible:border-slate-500 focus-visible:ring-slate-200"
                        onChange={(event) => {
                          setSearch(event.target.value);
                          setPage(1);
                        }}
                      />
                    </div>

                    <SelectField
                      label="Department"
                      value={filters.department}
                      options={DEPARTMENT_VALUES}
                      onChange={(value) => {
                        setFilters((prev) => ({ ...prev, department: value }));
                        setPage(1);
                      }}
                    />
                    <SelectField
                      label="Role"
                      value={filters.role}
                      options={ROLE_FILTER_OPTIONS}
                      onChange={(value) => {
                        setFilters((prev) => ({ ...prev, role: value }));
                        setPage(1);
                      }}
                    />
                    <SelectField
                      label="Batch"
                      value={filters.batch}
                      options={BATCH_OPTIONS}
                      onChange={(value) => {
                        setFilters((prev) => ({ ...prev, batch: value }));
                        setPage(1);
                      }}
                    />
                  </form>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="w-full max-w-full overflow-x-auto rounded border border-slate-200 bg-card">
            <table className="w-full min-w-[760px] table-fixed">
              <thead className="border-b border-slate-800 bg-slate-900">
                <tr className="text-left text-sm">
                  <th className="w-[72px] px-3 py-3 font-medium" />
                  <th className="w-[180px] px-3 py-3 font-medium text-slate-50">Nama</th>
                  <th className="w-[240px] px-3 py-3 font-medium text-slate-50">Email</th>
                  {!isRoleScoped ? (
                    <th className="w-[120px] px-3 py-3 font-medium text-slate-50">Role</th>
                  ) : null}
                  <th className="w-[120px] px-3 py-3 text-center font-medium text-slate-50">
                    Verified
                  </th>
                  <th className="w-[140px] px-3 py-3 font-medium text-slate-50">User Type</th>
                  <th className="sticky right-0 z-10 relative w-[120px] bg-slate-900 px-3 py-3 text-center font-medium text-slate-50 shadow-[-6px_0_10px_-10px_rgba(15,23,42,0.35)] before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading || !hasLoadedOnce ? (
                  <tr>
                    <td colSpan={columnCount} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : users.length ? (
                  users.map((user) => (
                    <tr key={String(user.uid)} className="border-b last:border-b-0">
                      <td className="px-3 py-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase">
                          {getUserInitials(user)}
                        </div>
                      </td>
                      <td className="truncate px-3 py-2">{user.name}</td>
                      <td className="truncate px-3 py-2 text-muted-foreground">{user.email}</td>
                      {!isRoleScoped ? <td className="px-3 py-2">{user.role}</td> : null}
                      <td className="px-3 py-2 text-center">
                        {user.isVerified ? (
                          <CheckCircle2 className="mx-auto h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="mx-auto h-4 w-4 text-red-600" />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            user.userType.toUpperCase() === USER_TYPE_VALUES.INTERNAL
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-sky-500/10 text-sky-700"
                          }`}
                        >
                          {user.userType}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 relative bg-card px-3 py-2 shadow-[-6px_0_10px_-10px_rgba(15,23,42,0.18)] before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setActiveAction("detail");
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManageUsers ? (
                            <AlertDialog
                              open={deleteCandidate?.id === user.id}
                              onOpenChange={(open) => {
                                if (open) {
                                  setDeleteCandidate(user);
                                  return;
                                }
                                if (deleteCandidate?.id === user.id) setDeleteCandidate(null);
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon-sm" disabled={isDeleting}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent size="sm">
                                <AlertDialogHeader className="place-items-start text-left">
                                  <AlertDialogTitle>Hapus user?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    User <span className="font-semibold">{user.name || user.email}</span>{" "}
                                    akan dihapus.
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
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columnCount} className="px-3 py-6 text-center text-muted-foreground">
                      Tidak ada user terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex w-fit max-w-full self-start flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(1)}
                aria-label="Halaman pertama"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {visiblePages.map((pageNumber) => (
                <Button
                  key={pageNumber}
                  type="button"
                  variant={pageNumber === page ? "default" : "ghost"}
                  size="sm"
                  className="min-w-8 px-2"
                  disabled={isLoading}
                  onClick={() => setPage(pageNumber)}
                  aria-label={`Halaman ${pageNumber}`}
                >
                  {pageNumber}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage(totalPages)}
                aria-label="Halaman terakhir"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {!isMobile && isActionOpen ? (
          <aside className="sticky top-4 hidden w-full max-w-[380px] shrink-0 rounded border bg-card shadow-xs lg:block">
            <ActionPanelContent
              key={activeAction === "detail" ? `detail-${String(selectedUser?.uid ?? "")}` : activeAction ?? "none"}
              action={activeAction}
              roleParam={roleParam}
              selectedUser={selectedUser}
              canManageUsers={canManageUsers}
              onClose={panelCallbacks.onClose}
              onRefresh={panelCallbacks.onRefresh}
              onSelectUser={panelCallbacks.onSelectUser}
              onUsersPatch={panelCallbacks.onUsersPatch}
              onTotalCountChange={panelCallbacks.onTotalCountChange}
              onError={panelCallbacks.onError}
            />
          </aside>
        ) : null}
      </div>

      <Sheet
        open={isMobile && isActionOpen}
        onOpenChange={(open) => {
          if (!open) setActiveAction(null);
        }}
      >
        <SheetContent side="right" showCloseButton={false} className="w-[92vw] p-0 sm:max-w-md">
          <ActionPanelContent
            key={activeAction === "detail" ? `detail-${String(selectedUser?.uid ?? "")}` : activeAction ?? "none"}
            action={activeAction}
            roleParam={roleParam}
            selectedUser={selectedUser}
            canManageUsers={canManageUsers}
            onClose={panelCallbacks.onClose}
            onRefresh={panelCallbacks.onRefresh}
            onSelectUser={panelCallbacks.onSelectUser}
            onUsersPatch={panelCallbacks.onUsersPatch}
            onTotalCountChange={panelCallbacks.onTotalCountChange}
            onError={panelCallbacks.onError}
          />
        </SheetContent>
      </Sheet>
    </section>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900/90">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm outline-none shadow-xs focus-visible:border-slate-500 focus-visible:ring-[3px] focus-visible:ring-slate-200"
      >
        <option value="">Semua</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

type ActionPanelContentProps = {
  action: ActionType | null;
  roleParam: string | null;
  selectedUser: UserRow | null;
  canManageUsers: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onSelectUser: (user: UserRow | null) => void;
  onUsersPatch: React.Dispatch<React.SetStateAction<UserRow[]>>;
  onTotalCountChange: React.Dispatch<React.SetStateAction<number>>;
  onError: (message: string) => void;
};

function ActionPanelContent({
  action,
  roleParam,
  selectedUser,
  canManageUsers,
  onClose,
  onRefresh,
  onSelectUser,
  onUsersPatch,
  onTotalCountChange,
  onError,
}: ActionPanelContentProps) {
  if (action === "create") {
    return <CreateUserPanel roleParam={roleParam} onClose={onClose} onCreated={onRefresh} />;
  }
  if (action === "bulk") {
    return <BulkCreatePanel roleParam={roleParam} onClose={onClose} onCompleted={onRefresh} />;
  }
  if (action === "detail") {
    return (
      <DetailUserPanel
        selectedUser={selectedUser}
        canManageUsers={canManageUsers}
        onClose={onClose}
        onSelectUser={onSelectUser}
        onUsersPatch={onUsersPatch}
        onTotalCountChange={onTotalCountChange}
        onRefresh={onRefresh}
        onError={onError}
      />
    );
  }
  return null;
}

type CreateUserPanelProps = {
  roleParam: string | null;
  onClose: () => void;
  onCreated: () => void;
};

function CreateUserPanel({ roleParam, onClose, onCreated }: CreateUserPanelProps) {
  const normalizedRoleParam = (() => {
    if (!roleParam) return "";
    const upperRole = roleParam.toUpperCase();
    return (ROLE_FILTER_OPTIONS as readonly string[]).includes(upperRole) ? upperRole : "";
  })();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: normalizedRoleParam,
    department: "",
    batch: "",
    idNumber: "",
  });
  const { createUser, isSubmitting, errorMessage, setErrorMessage } = useCreateUser();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.fullName.trim()) return setErrorMessage("Nama wajib diisi.");
    if (!formData.email.trim()) return setErrorMessage("Email wajib diisi.");
    if (!formData.password) return setErrorMessage("Password wajib diisi.");

    const payload: Record<string, string> = {
      full_name: formData.fullName.trim(),
      email: formData.email.trim(),
      username: formData.email.trim().split("@")[0] || "user",
      password1: formData.password,
      password2: formData.password,
      user_type: USER_TYPE_VALUES.INTERNAL,
    };

    if (formData.role) payload.role = formData.role;
    if (formData.role === "STUDENT") {
      if (formData.department) payload.department = formData.department;
      if (formData.batch) payload.batch = formData.batch;
      if (formData.idNumber) payload.id_number = formData.idNumber;
    }

    const result = await createUser(payload as never);
    if (result.ok) {
      onCreated();
      onClose();
    }
  };

  return (
    <div className="max-h-[calc(100svh-7rem)] overflow-y-auto p-4">
      <PanelHeader title="Buat User" onClose={onClose} />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-xs font-medium">Nama Lengkap</label>
          <Input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Nama lengkap"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Email</label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="nim@student.prasetiyamulya.ac.id"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
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
            name="role"
            value={formData.role}
            onChange={handleChange}
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

        {formData.role === "STUDENT" ? (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium">ID Number</label>
              <Input
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="Nomor identitas"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
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
            <div className="space-y-1">
              <label className="text-xs font-medium">Batch</label>
              <select
                name="batch"
                value={formData.batch}
                onChange={handleChange}
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
          </>
        ) : null}

        {errorMessage ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
          <UserPlus className="h-4 w-4" />
          {isSubmitting ? "Menyimpan..." : "Buat User"}
        </Button>
      </form>
    </div>
  );
}

type BulkCreatePanelProps = {
  roleParam: string | null;
  onClose: () => void;
  onCompleted: () => void;
};

function BulkCreatePanel({ roleParam, onClose, onCompleted }: BulkCreatePanelProps) {
  const normalizedRoleParam = roleParam ? roleParam.toUpperCase() : "";
  const hasRoleScope = Boolean(normalizedRoleParam);
  const [previewRows, setPreviewRows] = useState<BulkRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [results, setResults] = useState<{ index: number; status: "success" | "error"; message: string }[]>([]);
  const { createUsers, isSubmitting } = useBulkCreateUsers();

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setErrorMessage("");
    setResults([]);
    if (!file) {
      setPreviewRows([]);
      setFileName("");
      return;
    }

    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        setErrorMessage("File tidak memiliki sheet.");
        setPreviewRows([]);
        return;
      }
      const sheet = workbook.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
      const [headerRow, ...bodyRows] = raw;
      if (!headerRow || headerRow.length === 0) {
        setErrorMessage("Header tidak ditemukan pada file.");
        setPreviewRows([]);
        return;
      }

      const headerIndexes: Partial<Record<keyof BulkRow, number>> = {};
      headerRow.forEach((header, index) => {
        const mapped = HEADER_MAP[normalizeHeader(header)];
        if (mapped) headerIndexes[mapped] = index;
      });

      const rows = bodyRows
        .map((row, index): BulkRow | null => {
          const full_name = String(row[headerIndexes.full_name ?? -1] || "").trim();
          const email = String(row[headerIndexes.email ?? -1] || "").trim();
          const password = String(row[headerIndexes.password ?? -1] || "").trim();
          const role = String(row[headerIndexes.role ?? -1] || "").trim();
          if (!full_name && !email && !password && !role) return null;
          return {
            index: index + 2,
            full_name,
            email,
            password,
            role: normalizedRoleParam || role,
            user_type: USER_TYPE_VALUES.INTERNAL,
          };
        })
        .filter((row): row is BulkRow => row !== null)
        .filter((row) => row.full_name && row.email && row.password);

      setPreviewRows(rows);
      if (!rows.length) {
        setErrorMessage("Tidak ada data valid untuk diproses.");
      }
    } catch (error) {
      console.error("Failed to parse file:", error);
      setErrorMessage("Gagal membaca file. Pastikan format Excel benar.");
      setPreviewRows([]);
    }
  };

  const handleDownloadTemplate = () => {
    const workbook = buildTemplateWorkbook(hasRoleScope);
    XLSX.writeFile(workbook, "template-bulk-user.xlsx");
  };

  const handleSubmitBulk = async () => {
    if (!previewRows.length) {
      setErrorMessage("Tidak ada baris valid untuk diproses.");
      return;
    }
    const bulkResults = await createUsers(previewRows, setResults);
    const successCount = bulkResults.filter((row) => row.status === "success").length;
    if (successCount > 0) {
      onCompleted();
      onClose();
    }
  };

  return (
    <div className="max-h-[calc(100svh-7rem)] overflow-y-auto p-4 space-y-4">
      <PanelHeader title="Bulk Upload User" onClose={onClose} />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Upload file Excel dengan kolom: nama lengkap, email, password
          {hasRoleScope ? "." : ", role."}
        </p>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleDownloadTemplate}>
          <FileDown className="h-4 w-4" />
          Template
        </Button>
      </div>

      <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-center transition hover:border-primary/50 hover:bg-muted/50">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="sr-only"
        />
        <p className="text-sm font-medium">{fileName ? "Ganti file" : "Klik untuk memilih file"}</p>
        <p className="text-xs text-muted-foreground">
          {fileName ? `File terpilih: ${fileName}` : "Mendukung .xlsx, .xls, .csv"}
        </p>
      </label>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {previewRows.length ? (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-xs font-medium">Preview valid rows: {previewRows.length}</p>
          <div className="max-h-48 overflow-auto rounded-md border">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="w-[64px] px-2 py-2 font-medium">Baris</th>
                  <th className="px-2 py-2 font-medium">Nama</th>
                  <th className="px-2 py-2 font-medium">Email</th>
                  <th className="px-2 py-2 font-medium">Password</th>
                  <th className="w-[96px] px-2 py-2 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr key={row.index} className="border-t">
                    <td className="px-2 py-2 text-muted-foreground">{row.index}</td>
                    <td className="px-2 py-2">{row.full_name}</td>
                    <td className="px-2 py-2 text-muted-foreground">{row.email}</td>
                    <td className="px-2 py-2">{row.password || "-"}</td>
                    <td className="px-2 py-2">{row.role || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {results.length ? (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-xs font-medium">Hasil proses</p>
          <div className="max-h-40 space-y-1 overflow-y-auto text-xs">
            {results.map((row) => (
              <p key={`${row.index}-${row.status}`} className={row.status === "success" ? "text-emerald-700" : "text-destructive"}>
                Baris {row.index}: {row.message}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <Button type="button" className="w-full gap-2" disabled={isSubmitting} onClick={() => void handleSubmitBulk()}>
        <UploadCloud className="h-4 w-4" />
        {isSubmitting ? "Memproses..." : "Buat Semua"}
      </Button>
    </div>
  );
}

type DetailUserPanelProps = {
  selectedUser: UserRow | null;
  canManageUsers: boolean;
  onClose: () => void;
  onSelectUser: (user: UserRow | null) => void;
  onUsersPatch: React.Dispatch<React.SetStateAction<UserRow[]>>;
  onTotalCountChange: React.Dispatch<React.SetStateAction<number>>;
  onRefresh: () => void;
  onError: (message: string) => void;
};

function DetailUserPanel({
  selectedUser,
  canManageUsers,
  onClose,
  onSelectUser,
  onUsersPatch,
  onTotalCountChange,
  onRefresh,
  onError,
}: DetailUserPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: selectedUser?.name || "",
    role: selectedUser?.role || "",
    department: selectedUser?.department === "-" ? "" : selectedUser?.department || "",
    batch: selectedUser?.batch === "-" ? "" : selectedUser?.batch || "",
    id_number: selectedUser?.idNumber === "-" ? "" : selectedUser?.idNumber || "",
    user_type: selectedUser?.userType === "-" ? "" : selectedUser?.userType || "",
  });
  const { updateUserProfile, isSubmitting, message } = useUpdateUserProfile();
  const { deleteUser, isDeleting } = useDeleteUser();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (!selectedUser) {
    return (
      <div className="p-4">
        <PanelHeader title="Detail User" onClose={onClose} />
        <p className="text-sm text-muted-foreground">Pilih user untuk melihat detail.</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!selectedUser.profileId) {
      onError("Profile ID tidak ditemukan.");
      return;
    }
    try {
      const updated = await updateUserProfile(selectedUser.profileId, {
        full_name: form.full_name,
        role: form.role || null,
        department: form.department || null,
        batch: form.batch || null,
        id_number: form.id_number || null,
        user_type: form.user_type || null,
      });

      const nextUser: UserRow = {
        ...selectedUser,
        name: String(updated.full_name || form.full_name || selectedUser.name),
        role: String(updated.role || form.role || "-"),
        department: String(updated.department || form.department || "-"),
        batch: String(updated.batch || form.batch || "-"),
        idNumber: String(updated.id_number || form.id_number || "-"),
        userType: String(updated.user_type || form.user_type || "-"),
      };

      onUsersPatch((prev) => prev.map((item) => (item.uid === selectedUser.uid ? nextUser : item)));
      onSelectUser(nextUser);
      setIsEditing(false);
      onRefresh();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Gagal update user.");
    }
  };

  const handleDeleteFromDetail = async () => {
    if (!selectedUser?.id) return;
    const result = await deleteUser(selectedUser.id);
    if (!result.ok) {
      onError(result.message || "Gagal menghapus user.");
      return;
    }
    onUsersPatch((prev) => prev.filter((item) => item.id !== selectedUser.id));
    onTotalCountChange((prev) => Math.max(0, prev - 1));
    onSelectUser(null);
    setConfirmDeleteOpen(false);
    onClose();
  };

  return (
    <div className="max-h-[calc(100svh-7rem)] overflow-y-auto p-4 space-y-4">
      <PanelHeader title="Detail User" onClose={onClose} />

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Email</p>
        <p className="text-sm font-medium">{selectedUser.email}</p>
      </div>

      <DetailField label="Nama" value={form.full_name} editable={isEditing && canManageUsers} onChange={(value) => setForm((prev) => ({ ...prev, full_name: value }))} />
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
      <DetailField label="ID Number" value={form.id_number} editable={isEditing && canManageUsers} onChange={(value) => setForm((prev) => ({ ...prev, id_number: value }))} />

      {message ? (
        <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">{message}</div>
      ) : null}

      {canManageUsers ? (
        <div className="flex gap-2">
          {isEditing ? (
            <Button
              type="button"
              variant="outline"
              className="min-w-0 flex-1"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="min-w-0 flex-1"
            onClick={() => {
              if (isEditing) {
                void handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={isSubmitting}
          >
            {isEditing ? (isSubmitting ? "Menyimpan..." : "Simpan") : "Edit"}
          </Button>
        </div>
      ) : null}

      {canManageUsers ? (
        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" className="w-full" disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Hapus User"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader className="place-items-start text-left">
              <AlertDialogTitle>Hapus user?</AlertDialogTitle>
              <AlertDialogDescription>
                User <span className="font-semibold">{selectedUser.name || selectedUser.email}</span> akan dihapus permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-start">
              <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={() => {
                  void handleDeleteFromDetail();
                }}
              >
                {isDeleting ? "Menghapus..." : "Hapus"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-2">
      <h3 className="text-base font-semibold">{title}</h3>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

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
      <label className="text-xs font-medium">{label}</label>
      {editable ? (
        <Input value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">{value || "-"}</div>
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
      <label className="text-xs font-medium">{label}</label>
      {editable ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Pilih {label.toLowerCase()}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">{value || "-"}</div>
      )}
    </div>
  );
}
