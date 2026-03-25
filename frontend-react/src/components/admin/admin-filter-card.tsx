"use client";

import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type AdminFilterCardProps = {
  open: boolean;
  onToggle: () => void;
  onReset: () => void;
  children: React.ReactNode;
};

export function AdminFilterCard({
  open,
  onToggle,
  onReset,
  children,
}: AdminFilterCardProps) {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-lg border border-slate-400/60 bg-gradient-to-br from-slate-50 to-slate-100/75 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div
        className={`flex items-center justify-between gap-3 px-4 transition-[padding] duration-250 ease-out ${
          open ? "py-2.5" : "py-1"
        }`}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={onToggle}
          aria-expanded={open}
          aria-label="Toggle filter"
        >
          <div
            className={`rounded-md bg-white text-slate-600 shadow-xs transition-all duration-250 ease-out ${
              open ? "scale-100 p-1.25" : "scale-95 p-1"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-slate-800">Filter</p>
        </button>
        <div
          className={`overflow-hidden transition-all duration-250 ease-out ${
            open ? "max-w-32 opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={(event) => {
              event.stopPropagation();
              onReset();
            }}
            tabIndex={open ? 0 : -1}
          >
            <X className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] border-t border-slate-200/70" : "grid-rows-[0fr] border-t border-transparent"
        }`}
        aria-hidden={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`bg-white px-4 transition-all duration-300 ease-out ${
              open ? "translate-y-0 pb-4.5 pt-3.5 opacity-100" : "-translate-y-1 pb-0 pt-0 opacity-0"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminFilterCard;
