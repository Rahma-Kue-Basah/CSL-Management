"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileDown,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertMessage } from "@/components/ui/alert-message";
import { useBulkCreateUsers } from "@/hooks/use-bulk-create-users";
import { ROLE_OPTIONS, normalizeRoleInput } from "@/constants/roles";
import { USER_TYPE_VALUES } from "@/constants/user-types";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const HEADER_MAP = {
  "nama lengkap": "full_name",
  nama: "full_name",
  "full name": "full_name",
  fullname: "full_name",
  email: "email",
  password: "password",
  role: "role",
};

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildTemplateWorkbook(roleParam) {
  const headers = roleParam
    ? ["nama lengkap", "email", "password"]
    : ["nama lengkap", "email", "password", "role"];
  const sample = [
    [
      "Aziz Rahmad",
      "aziz@student.prasetiyamulya.ac.id",
      "Password123",
      ...(roleParam ? [] : ["STUDENT"]),
    ],
  ];
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Users");
  return workbook;
}

export default function BulkUserFormPage() {
  const searchParams = useSearchParams();
  const roleParam = searchParams?.get("role") || "";
  const normalizedRoleParam = normalizeRoleInput(roleParam);
  const hasRoleScope = Boolean(normalizedRoleParam);
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const { createUsers, isSubmitting: isUploading } = useBulkCreateUsers();
  const [results, setResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  const validRows = useMemo(
    () => rows.filter((row) => row.email && row.password && row.full_name),
    [rows],
  );

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    setErrorMessage("");
    setResults([]);
    if (!file) {
      setRows([]);
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
        setRows([]);
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      const [headerRow, ...bodyRows] = raw;
      if (!headerRow || headerRow.length === 0) {
        setErrorMessage("Header tidak ditemukan pada file.");
        setRows([]);
        return;
      }

      const headerIndexes = {};
      headerRow.forEach((header, idx) => {
        const normalized = normalizeHeader(header);
        const mapped = HEADER_MAP[normalized];
        if (mapped) headerIndexes[mapped] = idx;
      });

      const mappedRows = bodyRows
        .map((row, index) => {
          const fullName = row[headerIndexes.full_name] || "";
          const email = row[headerIndexes.email] || "";
          const password = row[headerIndexes.password] || "";
          const role = row[headerIndexes.role];

          if (!fullName && !email && !password && !role) {
            return null;
          }

          return {
            index: index + 2,
            full_name: String(fullName || "").trim(),
            email: String(email || "").trim(),
            password: String(password || ""),
            role: normalizedRoleParam || role,
            user_type: USER_TYPE_VALUES.INTERNAL,
          };
        })
        .filter(Boolean);

      if (!mappedRows.length) {
        setErrorMessage("Tidak ada data valid untuk diproses.");
      }

      setRows(mappedRows);
    } catch (error) {
      console.error("Failed to parse file:", error);
      setErrorMessage("Gagal membaca file. Pastikan format Excel benar.");
      setRows([]);
    }
  };

  const handleDownloadTemplate = () => {
  const workbook = buildTemplateWorkbook(hasRoleScope ? roleParam : "");
    XLSX.writeFile(workbook, "template-bulk-user.xlsx");
  };

  const handleUpload = async () => {
    if (!validRows.length) {
      setErrorMessage("Tidak ada baris valid untuk diunggah.");
      return;
    }

    setErrorMessage("");
    const result = await createUsers(validRows, setResults);
    if (!result?.length) return;
    const success = result.filter((row) => row.status === "success").length;
    const error = result.filter((row) => row.status === "error").length;
    if (error) {
      toast.error(`Selesai: ${success} sukses, ${error} gagal.`);
    } else {
      toast.success(`Semua selesai: ${success} user ditambahkan.`);
    }
  };

  const handleReset = () => {
    setRows([]);
    setResults([]);
    setFileName("");
    setErrorMessage("");
    setEditingIndex(null);
  };

  const updateRow = (rowIndex, key, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.index === rowIndex ? { ...row, [key]: value } : row,
      ),
    );
  };

  const removeRow = (rowIndex) => {
    setRows((prev) => prev.filter((row) => row.index !== rowIndex));
    setResults((prev) => prev.filter((row) => row.index !== rowIndex));
  };

  const summary = useMemo(() => {
    const success = results.filter((r) => r.status === "success").length;
    const error = results.filter((r) => r.status === "error").length;
    return { success, error, total: results.length };
  }, [results]);
  const isFinished = summary.total && summary.total === validRows.length;
  const isAllFailed =
    isFinished && summary.success === 0 && summary.error === summary.total;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Upload file Excel dengan kolom: nama lengkap, email, password
            {hasRoleScope ? "." : ", dan role."}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Upload File Excel</p>
            <p className="text-xs text-muted-foreground">
              Format kolom: nama lengkap, email, password
              {hasRoleScope ? "." : ", role."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Download Template
          </Button>
        </div>

        <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-center transition hover:border-primary/50 hover:bg-muted/50">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            className="sr-only"
          />
          <p className="text-sm font-medium">
            {fileName ? "Ganti file" : "Klik untuk memilih file"}
          </p>
          <p className="text-xs text-muted-foreground">
            {fileName
              ? `File terpilih: ${fileName}`
              : "Mendukung .xlsx, .xls, .csv"}
          </p>
        </label>

        {errorMessage ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Baris valid: {validRows.length} dari {rows.length}
          </p>
        </div>
      </div>

      {rows.length ? (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Preview Data</h2>
            <div className="flex flex-wrap items-center gap-3">
              {!summary.total ? (
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading || !validRows.length}
                  className="gap-2"
                  size="sm"
                >
                  <UploadCloud className="h-4 w-4" />
                  {isUploading ? "Menambahkan..." : "Tambah semua"}
                </Button>
              ) : null}
              {summary.total ? (
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">
                    Sukses: {summary.success} · Gagal: {summary.error}
                  </p>
                  <div className="w-32">
                    <Progress
                      value={
                        rows.length
                          ? Math.round((summary.total / rows.length) * 100)
                          : 0
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          {!isAllFailed ? (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70px]">Baris</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Password</TableHead>
                    {!hasRoleScope ? <TableHead>Role</TableHead> : null}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      {!summary.total || summary.total !== validRows.length
                        ? "Aksi"
                        : ""}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const result = results.find((r) => r.index === row.index);
                    const isValid = row.full_name && row.email && row.password;
                    const isEditing = editingIndex === row.index;
                    return (
                      <TableRow key={`${row.email}-${row.index}`}>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.index}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <input
                            value={row.full_name}
                            onChange={(e) =>
                              updateRow(row.index, "full_name", e.target.value)
                            }
                            className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm"
                          />
                        ) : (
                          row.full_name || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <input
                            value={row.email}
                            onChange={(e) =>
                              updateRow(row.index, "email", e.target.value)
                            }
                            className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm"
                          />
                        ) : (
                          row.email || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <input
                            value={row.password}
                            onChange={(e) =>
                              updateRow(row.index, "password", e.target.value)
                            }
                            className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm"
                            placeholder="Password"
                          />
                        ) : (
                          row.password || "-"
                        )}
                      </TableCell>
                      {!hasRoleScope ? (
                        <TableCell>
                          {isEditing ? (
                            <select
                              value={row.role || ""}
                              onChange={(e) =>
                                updateRow(row.index, "role", e.target.value)
                              }
                              className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm"
                            >
                              {ROLE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            row.role || "-"
                          )}
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <div className="space-y-1">
                          {!isValid && (
                            <span
                              className="inline-flex items-center text-red-600"
                              title="Data kurang"
                            >
                              <XCircle className="h-4 w-4" />
                            </span>
                          )}
                          {isValid && !result && (
                            <span
                              className="inline-flex items-center text-muted-foreground"
                              title="Siap"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                          )}
                          {result?.status === "success" && (
                            <span
                              className="inline-flex items-center text-green-600"
                              title="Sukses"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                          )}
                          {result?.status === "error" && (
                            <>
                              {/* <span
                                className="inline-flex items-center text-red-600"
                                title={result.message}
                              >
                                <XCircle className="h-4 w-4" />
                              </span> */}
                              <p className="text-xs text-red-600 break-words">
                                {result.message || "Gagal"}
                              </p>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {!isFinished ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditingIndex(isEditing ? null : row.index)
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeRow(row.index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
          {isFinished ? (
            <div className="mt-4">
              <AlertMessage
                variant={summary.success ? "success" : "destructive"}
                dismissible={false}
              >
                Proses selesai. Sukses: {summary.success} · Gagal:{" "}
                {summary.error}. <br />
                {summary.success ? (
                  <Link
                    href={
                      hasRoleScope
                        ? `/user?role=${encodeURIComponent(roleParam)}`
                        : "/user"
                    }
                    className="underline"
                  >
                    Lihat daftar user
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="underline"
                  >
                    Coba lagi
                  </button>
                )}
              </AlertMessage>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
