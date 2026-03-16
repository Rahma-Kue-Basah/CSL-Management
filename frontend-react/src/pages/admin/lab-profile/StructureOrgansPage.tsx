"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Building2,
  GitBranch,
  Network,
  Pencil,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { API_STRUCTURE_ORGANIZATIONS } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { cn } from "@/lib/utils";

type StructureOrganizationItem = {
  id: string | number;
  title: string;
  name: string;
  parent: string | number | null;
  parent_detail?: {
    id: string | number;
    title: string;
    name: string;
  } | null;
};

type PaginatedResponse<T> = {
  results?: T[];
};

type StructureNode = StructureOrganizationItem & {
  children: StructureNode[];
};

function normalizeResponse(
  payload:
    | StructureOrganizationItem[]
    | PaginatedResponse<StructureOrganizationItem>
    | null,
) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;

  const detail = "detail" in payload ? payload.detail : null;
  if (typeof detail === "string" && detail.trim()) return detail;

  const firstEntry = Object.entries(payload).find(([, value]) => {
    if (typeof value === "string") return true;
    return Array.isArray(value) && typeof value[0] === "string";
  });

  if (!firstEntry) return fallback;

  const [, value] = firstEntry;
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return fallback;
}

function buildTree(items: StructureOrganizationItem[]) {
  const nodeMap = new Map<string, StructureNode>();

  items.forEach((item) => {
    nodeMap.set(String(item.id), {
      ...item,
      children: [],
    });
  });

  const roots: StructureNode[] = [];

  nodeMap.forEach((node) => {
    const parentId = node.parent == null ? null : String(node.parent);
    const parent = parentId ? nodeMap.get(parentId) : null;

    if (!parent) {
      roots.push(node);
      return;
    }

    parent.children.push(node);
  });

  const sortNodes = (nodes: StructureNode[]) => {
    nodes.sort((left, right) => {
      const titleCompare = left.title.localeCompare(right.title, "id-ID");
      if (titleCompare !== 0) return titleCompare;
      return left.name.localeCompare(right.name, "id-ID");
    });
    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);
  return roots;
}

function countLeafNodes(nodes: StructureNode[]): number {
  return nodes.reduce((total, node) => {
    if (node.children.length === 0) return total + 1;
    return total + countLeafNodes(node.children);
  }, 0);
}

function countDepth(nodes: StructureNode[]): number {
  if (nodes.length === 0) return 0;
  return Math.max(
    ...nodes.map(
      (node) => 1 + (node.children.length ? countDepth(node.children) : 0),
    ),
  );
}

type HierarchyNodeProps = {
  node: StructureNode;
  onEdit: (node: StructureOrganizationItem) => void;
  onDelete: (node: StructureOrganizationItem) => void;
  isDeleting: boolean;
  depth?: number;
};

function HierarchyNode({
  node,
  onEdit,
  onDelete,
  isDeleting,
  depth = 0,
}: HierarchyNodeProps) {
  const hasChildren = node.children.length > 0;

  return (
    <div className="relative">
      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border p-4 shadow-xs",
          depth === 0
            ? "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50"
            : "border-slate-200 bg-white",
        )}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-slate-100/70 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              depth === 0
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700",
            )}
          >
            {depth === 0 ? (
              <Building2 className="h-5 w-5" />
            ) : (
              <UserRound className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
              {node.title}
            </span>
            <h2 className="mt-2 text-base font-semibold text-slate-900">
              {node.name}
            </h2>
            {hasChildren ? (
              <p className="mt-1 text-xs text-slate-500">
                {node.children.length} posisi turunan
              </p>
            ) : null}
          </div>
          <div className="ml-auto flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(node)}
              disabled={isDeleting}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => onDelete(node)}
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </article>

      {hasChildren ? (
        <div className="relative ml-5 border-l-2 border-slate-200 pl-6">
          <div className="absolute top-0 left-0 h-6 w-6 border-b-2 border-slate-200" />
          <div className="mt-4 space-y-4">
            {node.children.map((child) => (
              <div
                key={child.id}
                className="relative before:absolute before:-left-6 before:top-6 before:h-px before:w-6 before:bg-slate-200"
              >
                <HierarchyNode
                  node={child}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isDeleting={isDeleting}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function StructureOrgansPage() {
  const [items, setItems] = useState<StructureOrganizationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<StructureOrganizationItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] =
    useState<StructureOrganizationItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    name: "",
    parent: "",
  });

  async function loadStructureOrganizations() {
    setIsLoading(true);
    setError("");

    try {
      const response = await authFetch(API_STRUCTURE_ORGANIZATIONS, {
        method: "GET",
      });
      const data = (await response.json().catch(() => null)) as
        | StructureOrganizationItem[]
        | PaginatedResponse<StructureOrganizationItem>
        | null;

      if (!response.ok) {
        throw new Error("Gagal memuat struktur organisasi.");
      }

      setItems(normalizeResponse(data));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memuat data.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStructureOrganizations();
  }, []);

  const hierarchy = useMemo(() => buildTree(items), [items]);
  const parentOptions = useMemo(
    () =>
      items
        .filter((item) => {
          if (!editTarget) return true;
          return String(item.id) !== String(editTarget.id);
        })
        .sort((left, right) => {
          const titleCompare = left.title.localeCompare(right.title, "id-ID");
          if (titleCompare !== 0) return titleCompare;
          return left.name.localeCompare(right.name, "id-ID");
        }),
    [editTarget, items],
  );

  const summary = useMemo(
    () => ({
      totalNodes: items.length,
      totalRoots: hierarchy.length,
      totalLeafs: countLeafNodes(hierarchy),
      maxDepth: countDepth(hierarchy),
    }),
    [hierarchy, items.length],
  );

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage("");

    if (!formData.title.trim() || !formData.name.trim()) {
      setSubmitMessage("Jabatan dan nama wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = editTarget
        ? `${API_STRUCTURE_ORGANIZATIONS}${editTarget.id}/`
        : API_STRUCTURE_ORGANIZATIONS;
      const response = await authFetch(endpoint, {
        method: editTarget ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          name: formData.name.trim(),
          parent: formData.parent || null,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | StructureOrganizationItem
        | Record<string, unknown>
        | null;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            editTarget
              ? "Gagal memperbarui struktur organisasi."
              : "Gagal menambahkan struktur organisasi.",
          ),
        );
      }

      setFormData({
        title: "",
        name: "",
        parent: "",
      });
      setIsFormOpen(false);
      setEditTarget(null);
      setSubmitMessage(
        editTarget
          ? "Struktur organisasi berhasil diperbarui."
          : "Struktur organisasi berhasil ditambahkan.",
      );
      await loadStructureOrganizations();
    } catch (err) {
      setSubmitMessage(
        err instanceof Error
          ? err.message
          : editTarget
            ? "Terjadi kesalahan saat memperbarui struktur."
            : "Terjadi kesalahan saat menambahkan struktur.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (node: StructureOrganizationItem) => {
    setIsFormOpen(true);
    setEditTarget(node);
    setSubmitMessage("");
    setFormData({
      title: node.title,
      name: node.name,
      parent: node.parent == null ? "" : String(node.parent),
    });
  };

  const handleCancelEdit = () => {
    setIsFormOpen(false);
    setEditTarget(null);
    setSubmitMessage("");
    setFormData({
      title: "",
      name: "",
      parent: "",
    });
  };

  const handleCreateOpen = () => {
    setEditTarget(null);
    setSubmitMessage("");
    setFormData({
      title: "",
      name: "",
      parent: "",
    });
    setIsFormOpen(true);
  };

  const handleFormDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditTarget(null);
      setSubmitMessage("");
      setFormData({
        title: "",
        name: "",
        parent: "",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    setSubmitMessage("");

    try {
      const response = await authFetch(
        `${API_STRUCTURE_ORGANIZATIONS}${deleteTarget.id}/`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        throw new Error(
          getErrorMessage(data, "Gagal menghapus struktur organisasi."),
        );
      }

      if (editTarget && String(editTarget.id) === String(deleteTarget.id)) {
        handleCancelEdit();
      }

      setDeleteTarget(null);
      setSubmitMessage("Struktur organisasi berhasil dihapus.");
      await loadStructureOrganizations();
    } catch (err) {
      setSubmitMessage(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus struktur.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <Dialog open={isFormOpen} onOpenChange={handleFormDialogChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Struktur" : "Tambah Struktur"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? `Perbarui data ${editTarget.title} - ${editTarget.name}.`
                : "Tambahkan posisi baru ke bagan struktur organisasi laboratorium."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-xs font-medium text-slate-600">
                Jabatan
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Contoh: Kepala Laboratorium"
                className="border-slate-300 bg-white focus-visible:border-slate-500 focus-visible:ring-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-medium text-slate-600">
                Nama Personel
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Masukkan nama pengisi posisi"
                className="border-slate-300 bg-white focus-visible:border-slate-500 focus-visible:ring-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="parent" className="text-xs font-medium text-slate-600">
                Atasan Langsung
              </label>
              <select
                id="parent"
                name="parent"
                value={formData.parent}
                onChange={handleInputChange}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none shadow-xs focus-visible:border-slate-500 focus-visible:ring-[3px] focus-visible:ring-slate-200"
              >
                <option value="">Tidak ada parent / posisi paling atas</option>
                {parentOptions.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.title} - {item.name}
                  </option>
                ))}
              </select>
            </div>

            {submitMessage ? (
              <div
                className={cn(
                  "rounded-md border px-3 py-2 text-sm",
                  submitMessage.includes("berhasil")
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700",
                )}
              >
                {submitMessage}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleFormDialogChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Menyimpan..."
                  : editTarget
                    ? "Simpan Perubahan"
                    : "Tambah Struktur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>Hapus struktur organisasi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Data <strong>{deleteTarget.title}</strong> untuk{" "}
                  <strong>{deleteTarget.name}</strong> akan dihapus. Jika posisi ini punya
                  turunan, data turunannya juga bisa ikut terhapus.
                </>
              ) : (
                "Data struktur organisasi ini akan dihapus."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start">
            <AlertDialogCancel disabled={deletingId != null}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletingId != null}
              onClick={() => void handleDelete()}
            >
              {deletingId != null ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminPageHeader
        title="Struktur Organisasi"
        description="Bagan struktur organisasi laboratorium berdasarkan model posisi, nama personel, dan relasi parent."
        icon={<Network className="h-5 w-5 text-sky-200" />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<Building2 className="h-4 w-4" />}
          label="Total Posisi"
          value={summary.totalNodes}
          tone="blue"
        />
        <SummaryCard
          icon={<GitBranch className="h-4 w-4" />}
          label="Pucuk Struktur"
          value={summary.totalRoots}
          tone="slate"
        />
        <SummaryCard
          icon={<UserRound className="h-4 w-4" />}
          label="Posisi Daun"
          value={summary.totalLeafs}
          tone="emerald"
        />
        <SummaryCard
          icon={<Network className="h-4 w-4" />}
          label="Kedalaman Hierarki"
          value={summary.maxDepth}
          tone="amber"
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="order-1 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-xs xl:order-1">
          <div className="mb-4 flex items-center gap-2">
            <Network className="h-4 w-4 text-slate-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Bagan Hierarki Organisasi
              </h2>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-500">
              Memuat struktur organisasi...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-sm text-red-700">
              {error}
            </div>
          ) : hierarchy.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-500">
              Belum ada data struktur organisasi. Tambahkan data dengan field
              `title`, `name`, dan `parent` agar bagan hierarki tampil.
            </div>
          ) : (
            <div className="space-y-6">
              {hierarchy.map((node) => (
                <HierarchyNode
                  key={node.id}
                  node={node}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  isDeleting={deletingId != null}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="order-2 self-start rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-xs xl:order-2">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-slate-600" />
                <h2 className="text-sm font-semibold text-slate-900">Kelola Struktur</h2>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Tambah posisi baru melalui modal form. Edit dan hapus tersedia langsung dari
                masing-masing node di bagan.
              </p>
            </div>

            <Button type="button" className="w-full" onClick={handleCreateOpen}>
              <Plus className="h-4 w-4" />
              Tambah Struktur
            </Button>

            {submitMessage ? (
              <div
                className={cn(
                  "rounded-md border px-3 py-2 text-sm",
                  submitMessage.includes("berhasil")
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700",
                )}
              >
                {submitMessage}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

type SummaryCardProps = {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "blue" | "slate" | "emerald" | "amber";
};

function SummaryCard({ icon, label, value, tone }: SummaryCardProps) {
  const toneClassName = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border",
            toneClassName,
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
