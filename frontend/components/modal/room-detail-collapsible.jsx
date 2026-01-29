"use client";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Building2,
  Hash,
  Layers,
  Users,
  UserCircle,
  Clock,
  Image as ImageIcon,
  FileText,
} from "lucide-react";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="text-sm font-medium break-words whitespace-pre-wrap leading-snug">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

export function RoomDetailCollapsible({ open, onOpenChange, selectedRoom }) {
  const imageUrl = selectedRoom?.imageDetail?.url || "";
  const picName =
    selectedRoom?.picDetail?.full_name ||
    selectedRoom?.picDetail?.email ||
    selectedRoom?.pic ||
    "";

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="fixed right-4 top-20 z-40 w-[420px] max-w-[95vw] md:right-60 data-[state=closed]:-translate-y-[320%] data-[state=open]:translate-y-0 data-[state=closed]:pointer-events-none transition-transform duration-300 ease-out"
    >
      <div className="rounded-lg border bg-card shadow-lg ring-1 ring-black/5">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">Detail Ruangan</p>
          {open ? (
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X size={16} />
            </Button>
          ) : null}
        </div>

        <CollapsibleContent asChild>
          <div className="border-t px-4 py-4 max-h-[65vh] overflow-y-auto space-y-4">
            {selectedRoom ? (
              <>
                <div className="space-y-2">
                  <p className="text-base font-semibold">
                    {selectedRoom.name || "—"}
                  </p>
                  {imageUrl ? (
                    <div className="overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={imageUrl}
                        alt={selectedRoom.name || "Room image"}
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Tidak ada gambar
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <InfoRow
                    icon={Hash}
                    label="Nomor Ruangan"
                    value={selectedRoom.number}
                  />
                  <InfoRow
                    icon={Layers}
                    label="Lantai"
                    value={selectedRoom.floor}
                  />
                  <InfoRow
                    icon={Users}
                    label="Kapasitas"
                    value={selectedRoom.capacity}
                  />
                  <InfoRow
                    icon={UserCircle}
                    label="PIC"
                    value={picName}
                  />
                  <InfoRow
                    icon={FileText}
                    label="Deskripsi"
                    value={selectedRoom.description}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Klik &quot;View Detail&quot; untuk melihat informasi.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default RoomDetailCollapsible;
