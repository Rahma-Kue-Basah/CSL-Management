"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { Filter, Pencil, Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";

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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useBorrows } from "@/hooks/use-borrows";
import { useBorrowActions } from "@/hooks/use-borrow-actions";
import { useLoadProfile } from "@/hooks/use-load-profile";
import { toast } from "sonner";

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-700",
  approved: "bg-emerald-500/10 text-emerald-600",
  borrowed: "bg-sky-500/10 text-sky-700",
  returned: "bg-slate-500/10 text-slate-600",
  rejected: "bg-rose-500/10 text-rose-700",
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "borrowed", label: "Borrowed" },
  { value: "returned", label: "Returned" },
  { value: "rejected", label: "Rejected" },
];

const formatStatus = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return format(parsed, "yyyy-MM-dd");
};

const formatTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return format(parsed, "HH:mm");
};

const formatTimeRange = (start, end) => {
  const startText = formatTime(start);
  const endText = formatTime(end);
  if (startText === "-" && endText === "-") return "-";
  if (endText === "-") return startText;
  return `${startText} - ${endText}`;
};

export default function MyBorrowsRequestPage() {
  const { profile } = useLoadProfile();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const { deleteBorrow, isSubmitting: isDeleting } = useBorrowActions();

  const {
    borrows,
    totalCount,
    isLoading,
    error,
    setBorrows,
    setTotalCount,
  } = useBorrows(page, pageSize, {
    status: filters.status,
    requested_by: profile?.id,
  });

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return borrows.filter((item) => {
      const equipmentName =
        item.equipmentDetail?.name || item.equipment || "-";
      const matchesSearch =
        !keyword ||
        String(item.code).toLowerCase().includes(keyword) ||
        String(equipmentName).toLowerCase().includes(keyword);
      const matchesStatus = !filters.status || item.status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [borrows, search, filters]);

  const totalPages = Math.max(1, Math.ceil((totalCount || 1) / pageSize));
  const currentPageItems = filteredRequests;

  const resetFilterState = () => {
    setFilters({ status: "" });
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus peminjaman ini?")) return;
    const result = await deleteBorrow(id);
    if (result.ok) {
      setBorrows((prev) => prev.filter((item) => item.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      toast.success("Peminjaman berhasil dihapus.");
    } else {
      toast.error(result.message || "Gagal menghapus peminjaman.");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">
          Total{" "}
          {search
            ? filteredRequests.length
            : totalCount || filteredRequests.length}{" "}
          peminjaman equipment.
        </p>
        <Button asChild size="sm" className="gap-2">
          <Link href="/my-borrows-request/form">
            <Plus className="h-4 w-4" />
            Tambah Peminjaman
          </Link>
        </Button>
      </div>

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
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              filters={filters}
              onFiltersChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
            />
          </CollapsibleContent>
        </div>
      </Collapsible>

      <div className="rounded-lg border bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[140px]">Kode</TableHead>
              <TableHead className="w-[260px]">Equipment</TableHead>
              <TableHead className="w-[140px]">Tanggal</TableHead>
              <TableHead className="w-[140px]">Waktu</TableHead>
              <TableHead className="w-[90px]">Jumlah</TableHead>
              <TableHead className="w-[180px] text-center sticky right-0 bg-card z-10">
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
                  <NextImage
                    src="/logo/stem.png"
                    alt="STEM Logo"
                    width={48}
                    height={48}
                    className="mx-auto animate-spin"
                    priority
                  />
                </TableCell>
              </TableRow>
            ) : currentPageItems.length ? (
              currentPageItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        STATUS_STYLES[item.status] ||
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell className="truncate">
                    {item.equipmentDetail?.name || item.equipment || "-"}
                  </TableCell>
                  <TableCell>{formatDate(item.startTime)}</TableCell>
                  <TableCell>
                    {formatTimeRange(item.startTime, item.endTime)}
                  </TableCell>
                  <TableCell>{item.quantity ?? "-"}</TableCell>
                  <TableCell className="text-center sticky right-0 bg-card">
                    <div className="flex justify-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/my-borrows-request/form/${item.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
                  {error || "Tidak ada peminjaman."}
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
                page <= 1 ? "pointer-events-none opacity-50" : ""
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
                page >= totalPages ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </section>
  );
}

function FilterBar({ search, onSearchChange, filters, onFiltersChange }) {
  const handleChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="rounded-lg bg-card px-1 py-3">
      <form
        className="flex flex-wrap justify-between items-end gap-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <InputField
          label="Cari"
          value={search}
          onChange={onSearchChange}
          placeholder="Kode atau equipment"
        />
        <SelectField
          label="Status"
          value={filters.status}
          options={STATUS_OPTIONS}
          placeholder="Semua"
          onChange={(value) => handleChange("status", value)}
        />
      </form>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div className="flex flex-col gap-0.5 w-full sm:w-[230px] min-w-0">
      <label className="text-xs font-medium leading-none mb-2 text-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm shadow-inner outline-none focus:border-primary"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-0.5 w-full sm:w-[230px] min-w-0">
      <label className="text-xs font-medium mb-2 leading-none text-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary"
      >
        <option value="">{placeholder || "Semua"}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
