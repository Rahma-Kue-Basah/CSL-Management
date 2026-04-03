"use client";

import { FileImage, Network } from "lucide-react";

const ORGANIZATION_STRUCTURE_IMAGE_SRC = "";

export default function DashboardStructureOrganizationsPage() {
  const hasImage = ORGANIZATION_STRUCTURE_IMAGE_SRC.trim().length > 0;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Network className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900">
            Bagan Struktur Organisasi
          </h2>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {hasImage ? (
              <img
                src={ORGANIZATION_STRUCTURE_IMAGE_SRC}
                alt="Bagan struktur organisasi"
                className="h-auto w-full object-contain"
              />
            ) : (
              <div className="flex min-h-[420px] items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_100%)] px-6 py-10 text-center">
                <div className="max-w-md space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <FileImage className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      Area gambar struktur organisasi
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Isi `ORGANIZATION_STRUCTURE_IMAGE_SRC` di file ini dengan
                      path gambar bagan yang ingin ditampilkan.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
