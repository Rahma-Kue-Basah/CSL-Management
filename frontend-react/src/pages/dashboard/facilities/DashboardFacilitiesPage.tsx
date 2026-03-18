"use client";

import { useEffect, useState } from "react";
import { Building2, ImageOff } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL, API_FACILITIES } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type Facility = {
  id: string | number;
  name?: string | null;
  description?: string | null;
  image_detail?: {
    url?: string | null;
  } | null;
};

type PaginatedResponse<T> = {
  results?: T[];
};

function normalizeResponse(
  payload: Facility[] | PaginatedResponse<Facility> | null,
) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function resolveAssetUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

export default function DashboardFacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFacilities() {
      setIsLoading(true);
      setError("");

      try {
        const response = await authFetch(API_FACILITIES, { method: "GET" });
        const data = (await response.json().catch(() => null)) as
          | Facility[]
          | PaginatedResponse<Facility>
          | null;

        if (!response.ok) {
          throw new Error("Gagal memuat data fasilitas.");
        }

        if (!isMounted) return;
        setFacilities(normalizeResponse(data));
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat fasilitas.",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadFacilities();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <Skeleton className="h-44 w-full" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))}
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
        {facilities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Belum ada data fasilitas yang dapat ditampilkan.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {facilities.map((facility) => {
              const imageUrl = resolveAssetUrl(
                facility.image_detail?.url ?? "",
              );

              return (
                <article
                  key={facility.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={facility.name || "Facility"}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-slate-400">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}
                  <div className="space-y-2 p-5">
                    <h3 className="text-base font-semibold text-slate-900">
                      {facility.name || "-"}
                    </h3>
                    <p className="text-sm leading-6 text-slate-600">
                      {facility.description || "Belum ada deskripsi fasilitas."}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
