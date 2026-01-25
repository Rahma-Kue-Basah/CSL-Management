"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Eye,
  X,
  UserCircle,
  Shield,
  IdCard,
  MailIcon,
  Info,
  ArrowUp,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";

import { useUsers } from "@/hooks/use-users";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function UserPage() {
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
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const { users, setUsers, totalCount, isLoading } = useUsers(page, pageSize, {
    ...filters,
    search: debouncedSearch,
  });

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

  const handleView = (user) => {
    setSelectedUser(user);
    setDetailOpen(true);
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
          <h1 className="text-2xl font-semibold">User</h1>
          <p className="text-sm text-muted-foreground">
            Total {totalUsers} user terdaftar.
          </p>
        </div>
      </div>

      <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-medium">Filter</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFilterOpen((v) => !v)}
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
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("batch")}
                  className="flex items-center gap-1"
                >
                  Batch <ArrowUp className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>Department</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
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
                  colSpan={9}
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
                  <TableCell>{user.batch}</TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>{user.idNumber}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell className="flex items-center justify-center">
                    {user.isVerified ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        user.userType === "INTERNAL"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-sky-500/10 text-sky-700"
                      }`}
                    >
                      {user.userType}
                    </span>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2 sticky right-0 bg-card">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedUser?.uid === user.uid && detailOpen) {
                          setDetailOpen(false);
                          setSelectedUser(null);
                        } else {
                          handleView(user);
                        }
                      }}
                    >
                      {selectedUser?.uid === user.uid && detailOpen ? (
                        <X size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={9}
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
                page >= totalPages || isLoading ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Collapsible
        open={detailOpen}
        onOpenChange={setDetailOpen}
        className="fixed right-4 top-20 z-40 w-[420px] max-w-[95vw] md:right-40 data-[state=closed]:-translate-y-[300%] data-[state=open]:translate-y-0 data-[state=closed]:pointer-events-none transition-transform duration-300 ease-out"
      >
        <div className="rounded-lg border bg-card shadow-lg ring-1 ring-black/5">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-medium">Detail User</p>
            {detailOpen ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailOpen(false)}
              >
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
                      value={selectedUser.id}
                    />
                    <InfoRow
                      icon={UserCircle}
                      label="Nama"
                      value={selectedUser.name}
                    />
                    <InfoRow
                      icon={Info}
                      label="Batch"
                      value={selectedUser.batch}
                    />
                    <InfoRow
                      icon={Shield}
                      label="Department"
                      value={selectedUser.department}
                    />
                  <InfoRow
                    icon={MailIcon}
                    label="Email"
                    value={
                      <span className="inline-flex items-center gap-1">
                        {selectedUser.email}
                        {selectedUser?.isVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </span>
                    }
                  />
                    <InfoRow
                      icon={Shield}
                      label="Role"
                      value={selectedUser.role}
                    />
                    <InfoRow
                      icon={Shield}
                      label="User Type"
                      value={
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            selectedUser.userType === "INTERNAL"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-sky-500/10 text-sky-700"
                          }`}
                        >
                          {selectedUser.userType}
                        </span>
                      }
                    />
                  </div>
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
    </section>
  );
}

const DEPARTMENTS = [
  "Digital Business Technology",
  "Artificial Inteligence and Robotic",
  "Business Mathematics",
  "Food Business Technology",
  "Product Design and Innovation",
  "Energy Business and Technology",
];

const ROLES = ["Student", "Lecturer", "Admin", "Staff", "Other"];
const BATCHES = [
  "2020",
  "2021",
  "2022",
  "2023",
  "2024",
  "2025",
  "2026",
  "2027",
  "2028",
];
const USER_TYPES = ["INTERNAL", "EXTERNAL"];

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
          options={DEPARTMENTS}
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
          options={BATCHES}
          onChange={(value) => handleChange("batch", value)}
        />
        <SelectField
          label="User Type"
          value={filters.user_type}
          options={USER_TYPES}
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
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="text-sm font-medium break-words whitespace-pre-wrap leading-snug">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}
