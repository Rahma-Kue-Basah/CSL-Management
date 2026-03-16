"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Network, UserRound } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { API_STRUCTURE_ORGANIZATIONS } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { cn } from "@/lib/utils";

type StructureOrganizationItem = {
  id: string | number;
  title: string;
  name: string;
  parent: string | number | null;
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

function VerticalNode({
  node,
  depth = 0,
}: {
  node: StructureNode;
  depth?: number;
}) {
  const hasChildren = node.children.length > 0;

  return (
    <div className="relative">
      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border p-4",
          depth === 0
            ? "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50"
            : "border-slate-200 bg-white",
        )}
      >
        <div className="flex items-start gap-3">
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
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {node.title}
            </span>
            <h3 className="mt-2 text-sm font-semibold text-slate-900">
              {node.name}
            </h3>
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
                <VerticalNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardStructureOrganizationsPage() {
  const [items, setItems] = useState<StructureOrganizationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStructures() {
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

        if (!isMounted) return;
        setItems(normalizeResponse(data));
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat data.",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadStructures();

    return () => {
      isMounted = false;
    };
  }, []);

  const hierarchy = useMemo(() => buildTree(items), [items]);
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-6 h-40 w-full" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-slate-600" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Bagan Struktur Organisasi
            </h2>
          </div>
        </div>

        {hierarchy.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Belum ada data struktur organisasi yang dapat ditampilkan.
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="space-y-8">
              {hierarchy.map((node) => (
                <VerticalNode key={node.id} node={node} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
