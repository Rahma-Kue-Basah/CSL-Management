"use client";

import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type InventoryFilterCardProps = {
  open: boolean;
  onToggle: () => void;
  onReset: () => void;
  children: React.ReactNode;
};

export function InventoryFilterCard({
  open,
  onToggle,
  onReset,
  children,
}: InventoryFilterCardProps) {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-400/60 bg-gradient-to-br from-slate-50 to-slate-100/75 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={onToggle}
          aria-expanded={open}
          aria-label="Toggle filter"
        >
          <div className="rounded-md bg-white p-1.5 text-slate-600 shadow-xs">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-slate-800">Filter</p>
        </button>
        {open ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={(event) => {
              event.stopPropagation();
              onReset();
            }}
          >
            <X className="h-4 w-4" />
            Reset
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="border-t border-slate-200/70 bg-white px-4 pb-4.5 pt-3.5">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default InventoryFilterCard;
