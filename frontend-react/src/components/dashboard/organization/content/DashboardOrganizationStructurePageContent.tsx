"use client";


import { useEffect, useState, type WheelEvent } from "react";

import { FileImage, Network, Search, ZoomIn, ZoomOut } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui";

const ORGANIZATION_STRUCTURE_IMAGE_SRC = "";
const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_STEP = 0.2;

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(value.toFixed(2))));
}

export default function DashboardOrganizationStructurePage() {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const hasImage = ORGANIZATION_STRUCTURE_IMAGE_SRC.trim().length > 0;

  useEffect(() => {
    if (!isViewerOpen) {
      setScale(1);
    }
  }, [isViewerOpen]);

  const zoomIn = () => setScale((current) => clampScale(current + SCALE_STEP));
  const zoomOut = () => setScale((current) => clampScale(current - SCALE_STEP));
  const resetZoom = () => setScale(1);

  const handleWheelZoom = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      zoomIn();
      return;
    }
    zoomOut();
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Bagan Struktur Organisasi
            </h2>
            <p className="text-xs text-slate-500">
              Klik gambar untuk membuka viewer dan zoom.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {hasImage ? (
              <button
                type="button"
                onClick={() => setIsViewerOpen(true)}
                className="group relative block w-full overflow-hidden text-left"
              >
                <img
                  src={ORGANIZATION_STRUCTURE_IMAGE_SRC}
                  alt="Bagan struktur organisasi"
                  className="h-auto w-full object-contain transition duration-200 group-hover:scale-[1.01]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-transparent px-4 py-4 text-white">
                  <span className="text-sm font-medium">
                    Klik untuk perbesar
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs backdrop-blur-sm">
                    <Search className="h-3.5 w-3.5" />
                    Zoom Viewer
                  </span>
                </div>
              </button>
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

      {hasImage ? (
        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
          <DialogContent className="flex h-[92vh] max-w-[96vw] flex-col gap-0 overflow-hidden border-slate-200 p-0">
            <DialogTitle className="sr-only">
              Viewer bagan struktur organisasi
            </DialogTitle>

            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Struktur Organisasi
                </p>
                <p className="text-xs text-slate-500">
                  Gunakan tombol zoom atau scroll mouse.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={zoomOut}
                  disabled={scale <= MIN_SCALE}
                >
                  <ZoomOut className="h-4 w-4" />
                  Zoom Out
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetZoom}
                >
                  100%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={zoomIn}
                  disabled={scale >= MAX_SCALE}
                >
                  <ZoomIn className="h-4 w-4" />
                  Zoom In
                </Button>
              </div>
            </div>

            <div
              className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,#eff6ff_0%,#e2e8f0_45%,#cbd5e1_100%)] p-4"
              onWheel={handleWheelZoom}
            >
              <div className="flex min-h-full min-w-max items-center justify-center">
                <img
                  src={ORGANIZATION_STRUCTURE_IMAGE_SRC}
                  alt="Bagan struktur organisasi"
                  className="max-w-none rounded-xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] transition-transform duration-150"
                  style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </section>
  );
}
