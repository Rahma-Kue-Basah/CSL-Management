"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileUp, Plus, UserPlus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import AdminRecordExportActions from "@/components/admin/records/AdminRecordExportActions";
import AdminRecordSummaryCards from "@/components/admin/records/AdminRecordSummaryCards";
import ConfirmDeleteDialog from "@/components/shared/confirm-delete-dialog";
import InlineErrorAlert from "@/components/shared/inline-error-alert";
import { AdminFilterCard } from "@/components/admin/admin-filter-card";
import BulkCreateDialog from "@/components/admin/user-management/BulkCreateDialog";
import CreateUserDialog from "@/components/admin/user-management/CreateUserDialog";
import UserBulkActions from "@/components/admin/user-management/UserBulkActions";
import UserDetailDialog from "@/components/admin/user-management/UserDetailDialog";
import UserTable from "@/components/admin/user-management/UserTable";
import { DataPagination } from "@/components/shared/data-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_AUTH_USERS_EXPORT } from "@/constants/api";
import { BATCH_OPTIONS } from "@/constants/batches";
import { DEPARTMENT_VALUES } from "@/constants/departments";
import { ROLE_FILTER_OPTIONS, isPrivilegedRole, normalizeRoleValue } from "@/constants/roles";
import { useAdminRecordExport } from "@/hooks/admin/use-admin-record-export";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import { useUserManagementActions } from "@/hooks/users/use-user-management-actions";
import { mapUser, useUsers } from "@/hooks/users/use-users";
import { USER_EXPORT_COLUMNS } from "@/lib/admin-record-export-config";
import { exportAdminRecordExcel, exportAdminRecordPdf } from "@/lib/admin-record-pdf";

type FiltersState = {
  department: string;
  role: string;
  batch: string;
};

const PAGE_SIZE = 20;

type UserManagementPageProps = {
  forcedRole?: string;
};

export default function UserManagementPage({ forcedRole }: UserManagementPageProps) {
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const [searchParams] = useSearchParams();
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
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [isExportingSelectedPdf, setIsExportingSelectedPdf] = useState(false);
  const [isExportingSelectedExcel, setIsExportingSelectedExcel] = useState(false);

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      role: roleParam ? normalizeRoleValue(roleParam) : filters.role,
    }),
    [filters, roleParam],
  );

  const {
    users,
    setUsers,
    totalCount,
    setTotalCount,
    aggregates,
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

  const { exportPdf, exportExcel, isExportingPdf, isExportingExcel } =
    useAdminRecordExport({
      endpoint: API_AUTH_USERS_EXPORT,
      filters: {
        department: effectiveFilters.department,
        role: effectiveFilters.role,
        batch: effectiveFilters.batch,
        search: debouncedSearch,
      },
      mapItem: mapUser,
      title: "User Management",
      pdfFilename: "user-management.pdf",
      excelFilename: "user-management.xlsx",
      columns: USER_EXPORT_COLUMNS,
      emptyMessage: "Tidak ada data user untuk diunduh.",
      pdfSuccessMessage: "PDF user management berhasil diunduh.",
      excelSuccessMessage: "Excel user management berhasil diunduh.",
    });

  const actions = useUserManagementActions({
    canManageUsers,
    users,
    setUsers,
    setTotalCount,
    setError,
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    actions.syncSelectionWithUsers(users);
    // sync selection only when the current page of users changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = Boolean(actions.someVisibleSelected);
  }, [actions.someVisibleSelected]);

  const totalUsers = totalCount || users.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || users.length) / PAGE_SIZE)),
    [totalCount, users.length],
  );

  const columnCount = isRoleScoped
    ? canManageUsers
      ? 7
      : 6
    : canManageUsers
      ? 8
      : 7;

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilters({ department: "", role: "", batch: "" });
    setPage(1);
  };

  const handleExportSelectedPdf = async () => {
    try {
      setIsExportingSelectedPdf(true);
      if (!actions.selectedRows.length) {
        throw new Error("Pilih minimal satu user untuk diunduh.");
      }
      exportAdminRecordPdf({
        title: "User Management",
        subtitle: `Total data: ${actions.selectedRows.length}`,
        filename: "user-management-selected.pdf",
        columns: USER_EXPORT_COLUMNS,
        rows: actions.selectedRows,
      });
      toast.success("PDF user terpilih berhasil diunduh.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh PDF.");
    } finally {
      setIsExportingSelectedPdf(false);
    }
  };

  const handleExportSelectedExcel = async () => {
    try {
      setIsExportingSelectedExcel(true);
      if (!actions.selectedRows.length) {
        throw new Error("Pilih minimal satu user untuk diunduh.");
      }
      exportAdminRecordExcel({
        title: "User Management",
        filename: "user-management-selected.xlsx",
        columns: USER_EXPORT_COLUMNS,
        rows: actions.selectedRows,
      });
      toast.success("Excel user terpilih berhasil diunduh.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh Excel.");
    } finally {
      setIsExportingSelectedExcel(false);
    }
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <div className="flex min-w-0 items-start gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <AdminPageHeader
            title="User Management"
            description={`Total ${totalUsers} user terdaftar.`}
            icon={<UserPlus className="h-5 w-5 text-sky-200" />}
          />

          {!isRoleScoped ? (
            <AdminRecordSummaryCards
              items={[
                { label: "Total", value: aggregates.total, tone: "blue" },
                { label: "Student", value: aggregates.student, tone: "blue" },
                { label: "Lecturer", value: aggregates.lecturer, tone: "emerald" },
                { label: "Admin", value: aggregates.admin, tone: "sky" },
                { label: "Staff", value: aggregates.staff, tone: "amber" },
                { label: "Guest", value: aggregates.guest, tone: "slate" },
              ]}
            />
          ) : null}

          {!isRoleScoped ? (
            <AdminFilterCard
              open={filterOpen}
              onToggle={() => setFilterOpen((prev) => !prev)}
              onReset={() => {
                resetFilters();
                setFilterOpen(false);
              }}
            >
              <form
                className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setPage(1);
                }}
              >
                <div className="min-w-0">
                  <label className="mb-1 block text-xs font-semibold text-slate-900/90">
                    Cari
                  </label>
                  <Input
                    type="search"
                    value={search}
                    placeholder="Nama, email, atau ID"
                    className="h-9 border-slate-400 bg-white shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
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
            </AdminFilterCard>
          ) : null}

          {error ? (
            <InlineErrorAlert>{error}</InlineErrorAlert>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {canManageUsers ? (
              <UserBulkActions
                selectedCount={actions.selectedCount}
                isDeleting={actions.isDeleting}
                isExportingSelectedPdf={isExportingSelectedPdf}
                isExportingSelectedExcel={isExportingSelectedExcel}
                onDeleteSelected={() => actions.setIsBulkDeleteOpen(true)}
                onExportSelectedPdf={() => {
                  void handleExportSelectedPdf();
                }}
                onExportSelectedExcel={() => {
                  void handleExportSelectedExcel();
                }}
              />
            ) : (
              <div />
            )}
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-end">
              <p className="text-xs text-muted-foreground sm:text-right">
                Export mengikuti filter dan pencarian yang sedang aktif.
              </p>
              <AdminRecordExportActions
                onExportExcel={() => {
                  void exportExcel();
                }}
                onExportPdf={() => {
                  void exportPdf();
                }}
                isExportingExcel={isExportingExcel}
                isExportingPdf={isExportingPdf}
              />
              {canManageUsers ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkOpen(true)}
                  >
                    <FileUp className="h-4 w-4" />
                    Import User
                  </Button>
                  <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Buat User
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          <UserTable
            users={users}
            isLoading={isLoading}
            hasLoadedOnce={hasLoadedOnce}
            canManageUsers={canManageUsers}
            isRoleScoped={isRoleScoped}
            columnCount={columnCount}
            selectedIds={actions.selectedIds}
            allVisibleSelected={Boolean(actions.allVisibleSelected)}
            onToggleItemSelection={actions.toggleItemSelection}
            onToggleSelectAllVisible={actions.toggleSelectAllVisible}
            onOpenDetail={actions.openDetail}
            onDelete={actions.setDeleteCandidate}
            isDeleting={actions.isDeleting}
            selectAllRef={selectAllRef}
          />

          <DataPagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            itemLabel="user"
            isLoading={isLoading}
            onPageChange={setPage}
          />
        </div>
      </div>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roleParam={roleParam}
        onCreated={() => setReloadKey((prev) => prev + 1)}
      />
      <BulkCreateDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        roleParam={roleParam}
        onCompleted={() => setReloadKey((prev) => prev + 1)}
      />
      <UserDetailDialog
        open={Boolean(actions.detailState.user)}
        user={actions.detailState.user}
        mode={actions.detailState.mode}
        canManageUsers={canManageUsers}
        onOpenChange={(open) => {
          if (!open) actions.closeDetail();
        }}
        onDeleteRequest={actions.setDeleteCandidate}
        onUserUpdated={(updatedUser) => {
          setUsers((prev) =>
            prev.map((item) =>
              String(item.id) === String(updatedUser.id) ? updatedUser : item,
            ),
          );
          actions.openDetail(updatedUser, actions.detailState.mode);
        }}
      />
      <ConfirmDeleteDialog
        open={Boolean(actions.deleteCandidate)}
        title="Hapus user?"
        description={
          actions.deleteCandidate
            ? `User ${actions.deleteCandidate.name || actions.deleteCandidate.email} akan dihapus.`
            : "Data yang dihapus tidak bisa dikembalikan."
        }
        isDeleting={actions.isDeleting}
        onOpenChange={(open) => {
          if (!open) actions.setDeleteCandidate(null);
        }}
        onConfirm={() => {
          void actions.handleDelete();
        }}
      />
      <ConfirmDeleteDialog
        open={actions.isBulkDeleteOpen}
        title="Hapus user terpilih?"
        description={`${actions.selectedCount} user yang dipilih akan dihapus permanen.`}
        isDeleting={actions.isDeleting}
        onOpenChange={actions.setIsBulkDeleteOpen}
        onConfirm={() => {
          void actions.handleBulkDelete();
        }}
      />
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
      <label className="mb-1 block text-xs font-semibold text-slate-900/90">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-slate-400 bg-white px-3 text-sm outline-none shadow-xs focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-100"
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
