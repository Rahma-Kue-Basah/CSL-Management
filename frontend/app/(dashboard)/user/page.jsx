"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserDetailCollapsible } from "@/components/modal/user-detail-collapsible";
import {
  Eye,
  X,
  ArrowUp,
  CheckCircle2,
  XCircle,
  Filter,
  Plus,
  FilePlus,
  Trash2,
  Pencil,
} from "lucide-react";

import { useUsers } from "@/hooks/use-users";
import { useLoadProfile } from "@/hooks/use-load-profile";
import { isPrivilegedRole, ROLE_FILTER_OPTIONS, ROLE_OPTIONS } from "@/constants/roles";
import { USER_TYPE_OPTIONS, USER_TYPE_VALUES } from "@/constants/user-types";
import { DEPARTMENT_FILTER_OPTIONS, DEPARTMENT_OPTIONS } from "@/constants/departments";
import { BATCH_OPTIONS } from "@/constants/batches";
import { useDeleteUser } from "@/hooks/use-delete-user";
import { useUserProfileEditor } from "@/hooks/use-user-profile-editor";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function UserPageContent() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    department: "",
    role: "",
    batch: "",
    user_type: "",
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const { profile } = useLoadProfile();
  const isPrivileged = isPrivilegedRole(profile?.role);
  const { deleteUser, isDeleting } = useDeleteUser();
  const roleParam = searchParams.get("role");
  const lastRoleParamRef = useRef(null);
  const isRoleScoped = !!roleParam;
  const { users, setUsers, totalCount, isLoading } = useUsers(page, pageSize, {
    ...filters,
    search: debouncedSearch,
  });
  const {
    editForm,
    isEditingProfile,
    detailMode,
    isUpdating,
    message,
    setMessage,
    setDetailMode,
    setIsEditingProfile,
    onChange: handleProfileChange,
    onCancel: handleProfileCancel,
    onSave: handleProfileSave,
    enterEditMode,
    enterViewMode,
  } = useUserProfileEditor({
    selectedUser,
    setUsers,
    setSelectedUser,
  });
  const roleOptions = ROLE_OPTIONS.filter((option) => option.value);

  useEffect(() => {
    if (roleParam) {
      lastRoleParamRef.current = roleParam;
      setFilters((prev) => ({ ...prev, role: roleParam }));
      setFilterOpen(false);
      setPage(1);
      return;
    }

    if (lastRoleParamRef.current) {
      lastRoleParamRef.current = null;
      resetFilterState();
      setFilterOpen(false);
    }
  }, [roleParam]);

  const resetFilterState = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilters({
      department: "",
      role: "",
      batch: "",
      user_type: "",
    });
    setPage(1);
  };

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    filters.department,
    filters.role,
    filters.batch,
    filters.user_type,
  ]);

  useEffect(() => {
    if (!selectedUser) return;
    const match = users.find((u) => u.uid === selectedUser.uid);
    if (match) {
      if (match !== selectedUser) setSelectedUser(match);
    } else {
      setSelectedUser(null);
      setDetailOpen(false);
    }
  }, [users, selectedUser]);

  const handleView = (user, mode = "view") => {
    setDetailMode(mode);
    setSelectedUser(user);
    setDetailOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteCandidate?.id) return;
    const result = await deleteUser(deleteCandidate.id);
    if (!result.ok) {
      toast.error(result.message || "Gagal menghapus user.");
      return;
    }
    setUsers((prev) =>
      prev.filter((item) => item.id !== deleteCandidate.id),
    );
    if (selectedUser?.id === deleteCandidate.id) {
      setSelectedUser(null);
      setDetailOpen(false);
    }
    setDeleteCandidate(null);
    toast.success("User berhasil dihapus.");
  };


  const sortedUsers = useMemo(() => {
    const sorted = [...users];
    sorted.sort((a, b) => {
      const aVal = (a[sortBy] || "").toString().toLowerCase();
      const bVal = (b[sortBy] || "").toString().toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [users, sortBy, sortDir]);

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const initials = (user) => {
    const source = user?.name || user?.email || "";
    const parts = source.trim().split(/\s+/).slice(0, 2);
    const chars = parts.map((p) => p[0]).join("");
    return chars ? chars.toUpperCase() : "U";
  };

  const totalUsers = useMemo(
    () => totalCount || users.length,
    [totalCount, users.length],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || users.length) / pageSize)),
    [totalCount, users.length],
  );

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {isRoleScoped ? `User ${roleParam}` : "User"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Total {totalUsers} user terdaftar.
          </p>
        </div>
        {isPrivileged && !isRoleScoped ? (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="outline" size="sm">
                  <Link href="/user/form-bulk" aria-label="Bulk upload">
                    <FilePlus className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Bulk Upload</TooltipContent>
            </Tooltip>
            <Button asChild size="sm" className="gap-2">
              <Link href="/user/form">
                <Plus className="h-4 w-4" />
                Tambah User
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      {!isRoleScoped ? (
        <Collapsible
          open={filterOpen}
          onOpenChange={(open) => {
            if (!open) resetFilterState();
            setFilterOpen(open);
          }}
        >
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-medium">Filter</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (filterOpen) resetFilterState();
                  setFilterOpen((v) => !v);
                }}
                className="h-8 gap-2"
              >
                {filterOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {filterOpen ? "Sembunyikan filter" : "Tampilkan filter"}
                </span>
              </Button>
            </div>
            <CollapsibleContent className="border-t px-3 pb-3 pt-2">
              <FilterBar
                search={search}
                onSearchChange={setSearch}
                filters={filters}
                onFiltersChange={(next) => {
                  setFilters(next);
                  setPage(1);
                }}
                onSearchSubmit={() => setPage(1)}
              />
            </CollapsibleContent>
          </div>
        </Collapsible>
      ) : null}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]"></TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="flex items-center gap-1"
                >
                  Nama <ArrowUp className="h-4 w-4" />
                </button>
              </TableHead>
              {/* <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("batch")}
                  className="flex items-center gap-1"
                >
                  Batch <ArrowUp className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>Department</TableHead>
              <TableHead>ID Number</TableHead> */}
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Verified</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead className="text-center sticky right-0 bg-card z-10">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-6 text-center text-muted-foreground"
                >
                  <Image
                    src="/logo/stem.png"
                    alt="STEM Logo"
                    width={48}
                    height={48}
                    className="mx-auto animate-spin"
                    priority
                  />
                </TableCell>
              </TableRow>
            ) : sortedUsers.length ? (
              sortedUsers.map((user, idx) => (
                <TableRow key={`${user.uid}-${idx}`}>
                  <TableCell className="font-medium">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase">
                      {initials(user)}
                    </div>
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  {/* <TableCell>{user.batch}</TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>{user.idNumber}</TableCell> */}
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell className="text-center align-middle">
                    <div className="flex justify-center">
                      {user.isVerified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        user.userType === USER_TYPE_VALUES.INTERNAL
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-sky-500/10 text-sky-700"
                      }`}
                    >
                      {user.userType}
                    </span>
                  </TableCell>
                  <TableCell className="sticky right-0 bg-card">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedUser?.uid === user.uid && detailOpen) {
                            setDetailOpen(false);
                            setSelectedUser(null);
                            enterViewMode();
                          } else {
                            handleView(user, "view");
                          }
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                      {isPrivileged ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedUser?.uid === user.uid && detailOpen) {
                              enterEditMode();
                              setDetailOpen(true);
                            } else {
                              handleView(user, "edit");
                            }
                          }}
                        >
                          <Pencil size={16} />
                        </Button>
                      ) : null}
                      {isPrivileged ? (
                        <AlertDialog
                          open={deleteCandidate?.id === user.id}
                          onOpenChange={(open) =>
                            setDeleteCandidate(open ? user : null)
                          }
                        >
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus user?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tindakan ini tidak bisa dibatalkan. User{" "}
                              <span className="font-semibold">
                                {user.name || user.email}
                              </span>{" "}
                              akan dihapus permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-6 text-center text-muted-foreground"
                >
                  Tidak ada user terdaftar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination className="w-full justify-between">
        <p className="text-sm text-muted-foreground">
          Halaman {page} dari {totalPages}
        </p>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage((p) => Math.max(1, p - 1));
              }}
              className={
                page <= 1 || isLoading ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage((p) => (p < totalPages ? p + 1 : p));
              }}
              className={
                page >= totalPages || isLoading
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <UserDetailCollapsible
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) enterViewMode();
        }}
        selectedUser={selectedUser}
        initials={initials}
        editForm={editForm}
        isPrivileged={isPrivileged}
        isEditing={isEditingProfile}
        isUpdating={isUpdating}
        message={message}
        roleOptions={roleOptions}
        userTypeOptions={USER_TYPE_OPTIONS}
        departmentOptions={DEPARTMENT_OPTIONS}
        batchOptions={BATCH_OPTIONS}
        onChange={handleProfileChange}
        onEditStart={enterEditMode}
        onCancel={handleProfileCancel}
        onSave={handleProfileSave}
      />
    </section>
  );
}

export default function UserPage() {
  return (
    <Suspense fallback={<div className="py-6 text-sm text-muted-foreground">Memuat...</div>}>
      <UserPageContent />
    </Suspense>
  );
}

const ROLES = ROLE_FILTER_OPTIONS;
function FilterBar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  onSearchSubmit,
}) {
  const handleChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="rounded-lg bg-card px-1 py-3">
      <form
        className="flex flex-wrap justify-between items-end gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit();
        }}
      >
        <div className="flex flex-col gap-0.5 w-[230px]">
          <label className="text-xs font-medium leading-none mb-2 text-foreground">
            Cari
          </label>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nama, email, atau ID"
            className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm shadow-inner outline-none focus:border-primary"
          />
        </div>

        <SelectField
          label="Department"
          value={filters.department}
          options={DEPARTMENT_FILTER_OPTIONS}
          onChange={(value) => handleChange("department", value)}
        />
        <SelectField
          label="Role"
          value={filters.role}
          options={ROLES}
          onChange={(value) => handleChange("role", value)}
        />
        <SelectField
          label="Batch"
          value={filters.batch}
          options={BATCH_OPTIONS}
          onChange={(value) => handleChange("batch", value)}
        />
        <SelectField
          label="User Type"
          value={filters.user_type}
          options={USER_TYPE_OPTIONS}
          onChange={(value) => handleChange("user_type", value)}
        />
      </form>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-0.5 w-[230px]">
      <label className="text-xs font-medium mb-2 leading-none text-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary"
      >
        <option value="">Semua</option>
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
    </div>
  );
}
