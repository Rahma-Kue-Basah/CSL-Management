"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  Network,
  Pencil,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFilterCard } from "@/components/admin/admin-filter-card";
import StructureOrganizationFormDialog, {
  type StructureOrganizationFormData,
} from "@/components/admin/lab-profile/structure-organization-form-dialog";
import ConfirmDeleteDialog from "@/components/shared/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_STRUCTURE_ORGANIZATIONS } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

function filterHierarchy(nodes: StructureNode[], query: string): StructureNode[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return nodes;

  return nodes.reduce<StructureNode[]>((acc, node) => {
    const filteredChildren = filterHierarchy(node.children, normalizedQuery);
    const matchesSelf = [node.title, node.name]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);

    if (!matchesSelf && filteredChildren.length === 0) {
      return acc;
    }

    acc.push({
      ...node,
      children: filteredChildren,
    });
    return acc;
  }, []);
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
          "rounded-xl border p-3.5",
          depth === 0
            ? "border-blue-200 bg-blue-50/60"
            : "border-slate-200 bg-white",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
              depth === 0
                ? "border-blue-200 bg-blue-100 text-blue-700"
                : "border-slate-200 bg-slate-50 text-slate-600",
            )}
          >
            <UserRound className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {node.title}
            </span>
            <h2 className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">
              {node.name}
            </h2>
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

function HierarchyNodeSkeleton({ depth = 0 }: { depth?: number }) {
  return (
    <div className="relative">
      <article
        className={cn(
          "rounded-xl border p-3.5",
          depth === 0
            ? "border-blue-200 bg-blue-50/60"
            : "border-slate-200 bg-white",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "h-9 w-9 shrink-0 animate-pulse rounded-lg border",
              depth === 0
                ? "border-blue-200 bg-blue-100"
                : "border-slate-200 bg-slate-100",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-4 w-40 animate-pulse rounded bg-slate-300/70" />
          </div>
          <div className="ml-auto flex shrink-0 gap-2">
            <div className="h-9 w-9 animate-pulse rounded-md border border-slate-200 bg-slate-100" />
            <div className="h-9 w-9 animate-pulse rounded-md border border-slate-200 bg-slate-100" />
          </div>
        </div>
      </article>
    </div>
  );
}

export default function StructureOrgansPage() {
  const [items, setItems] = useState<StructureOrganizationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<StructureOrganizationItem | null>(null);
  const [deleteDialogSnapshot, setDeleteDialogSnapshot] =
    useState<StructureOrganizationItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] =
    useState<StructureOrganizationItem | null>(null);
  const [formData, setFormData] = useState<StructureOrganizationFormData>({
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

  useEffect(() => {
    if (deleteTarget) {
      setDeleteDialogSnapshot(deleteTarget);
    }
  }, [deleteTarget]);

  const hierarchy = useMemo(() => buildTree(items), [items]);
  const visibleHierarchy = useMemo(
    () => filterHierarchy(hierarchy, search),
    [hierarchy, search],
  );
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
      toast.success(
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
    setDeleteTarget(null);
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
    setDeleteTarget(null);
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

  const resetFilters = () => {
    setSearch("");
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
      toast.success("Struktur organisasi berhasil dihapus.");
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

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open) {
      setDeleteTarget(null);
    }
  };

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <StructureOrganizationFormDialog
        open={isFormOpen}
        editTarget={editTarget}
        formData={formData}
        parentOptions={parentOptions}
        submitMessage={submitMessage}
        isSubmitting={isSubmitting}
        onOpenChange={handleFormDialogChange}
        onCloseReset={handleCancelEdit}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={handleDeleteDialogChange}
        title="Hapus struktur organisasi?"
        description={
          deleteDialogSnapshot
            ? `Data ${deleteDialogSnapshot.title} untuk ${deleteDialogSnapshot.name} akan dihapus. Jika posisi ini punya turunan, data turunannya juga bisa ikut terhapus.`
            : "Data struktur organisasi ini akan dihapus."
        }
        isDeleting={deletingId != null}
        onConfirm={() => void handleDelete()}
      />

      <AdminPageHeader
        title="Struktur Organisasi"
        description="Bagan struktur organisasi laboratorium berdasarkan model posisi, nama personel, dan relasi parent."
        icon={<Network className="h-5 w-5 text-sky-200" />}
      />

      <AdminFilterCard
        open={filterOpen}
        onToggle={() => setFilterOpen((prev) => !prev)}
        onReset={resetFilters}
      >
        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-semibold text-slate-900/90">
              Cari
            </label>
            <Input
              type="search"
              value={search}
              placeholder="Cari jabatan atau nama"
              className="border-slate-400 bg-white shadow-xs focus-visible:border-sky-600 focus-visible:ring-sky-100"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </form>
      </AdminFilterCard>

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
            <div className="space-y-4">
              <HierarchyNodeSkeleton depth={0} />
              <HierarchyNodeSkeleton depth={1} />
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
          ) : visibleHierarchy.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-500">
              Tidak ada struktur organisasi yang cocok dengan filter saat ini.
            </div>
          ) : (
            <div className="space-y-6">
              {visibleHierarchy.map((node) => (
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
