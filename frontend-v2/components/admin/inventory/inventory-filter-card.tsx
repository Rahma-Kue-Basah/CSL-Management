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
    <div className="w-full min-w-0 rounded border border-slate-300/70 bg-slate-100 shadow-xs">
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white/90 p-2 text-slate-700 shadow-xs">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-slate-900">Filter</p>
        </div>
        {open ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-2 border-slate-300 bg-white/90 text-slate-900 hover:bg-white"
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

      {open ? <div className="border-t border-slate-300/70 px-4 pb-4 pt-3">{children}</div> : null}
    </div>
  );
}

export default InventoryFilterCard;
