"use client";

import { ChevronDown, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AnnouncementBulkActionsProps = {
  selectedCount: number;
  isDeleting: boolean;
  onDeleteSelected: () => void;
};

export default function AnnouncementBulkActions({
  selectedCount,
  isDeleting,
  onDeleteSelected,
}: AnnouncementBulkActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={selectedCount === 0 || isDeleting}
        >
          Aksi Terpilih
          {selectedCount ? ` (${selectedCount})` : ""}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" className="w-48">
        <DropdownMenuItem
          variant="destructive"
          disabled={selectedCount === 0 || isDeleting}
          onClick={onDeleteSelected}
        >
          <Trash2 className="h-4 w-4" />
          Hapus Terpilih
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
