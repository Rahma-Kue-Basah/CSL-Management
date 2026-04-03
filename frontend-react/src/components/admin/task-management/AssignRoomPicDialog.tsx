"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import AdminDetailDialogShell from "@/components/shared/admin-detail-dialog-shell";
import InlineErrorAlert from "@/components/shared/inline-error-alert";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { USER_MODAL_WIDTH_CLASS } from "@/components/admin/user-management/user-management-fields";
import { useRoomDetail } from "@/hooks/rooms/use-rooms";
import { useRoomOptions } from "@/hooks/rooms/use-room-options";
import { useUpdateRoom } from "@/hooks/rooms/use-update-room";
import { usePicUsers } from "@/hooks/users/use-pic-users";

type AssignRoomPicDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
};

export default function AssignRoomPicDialog({
  open,
  onOpenChange,
  onAssigned,
}: AssignRoomPicDialogProps) {
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPicIds, setSelectedPicIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const { rooms, isLoading: isLoadingRooms, error: roomOptionsError } = useRoomOptions(open);
  const { picUsers, isLoading: isLoadingPics, error: picUsersError } = usePicUsers(open);
  const {
    room,
    isLoading: isLoadingRoomDetail,
    error: roomDetailError,
  } = useRoomDetail(selectedRoomId || null);
  const { updateRoom, isSubmitting, errorMessage, setErrorMessage } = useUpdateRoom();

  useEffect(() => {
    if (!room) return;
    setSelectedPicIds(room.picIds);
  }, [room]);

  const filteredPicUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return picUsers.filter((user) => {
      if (!normalized) return true;
      return `${user.name} ${user.role ?? ""} ${user.department ?? ""}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [picUsers, search]);

  const selectedPicSet = useMemo(() => new Set(selectedPicIds), [selectedPicIds]);
  const selectedPicChips = useMemo(
    () => picUsers.filter((user) => selectedPicSet.has(user.id)),
    [picUsers, selectedPicSet],
  );

  const resetState = () => {
    setSelectedRoomId("");
    setSearch("");
    setSelectedPicIds([]);
    setMessage("");
    setErrorMessage("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!selectedRoomId) {
      setMessage("Pilih ruangan terlebih dahulu.");
      return;
    }
    if (!room) {
      setMessage("Detail ruangan belum siap.");
      return;
    }

    const result = await updateRoom(selectedRoomId, {
      name: room.name,
      number: room.number,
      floor: room.floor,
      capacity: room.capacity,
      description: room.description,
      picIds: selectedPicIds,
      imageId: room.imageId,
    });
    if (!result.ok) return;

    toast.success("PIC ruangan berhasil diperbarui.");
    onAssigned();
    onOpenChange(false);
    resetState();
  };

  return (
    <AdminDetailDialogShell
      open={open}
      onOpenChange={onOpenChange}
      onCloseReset={resetState}
      title="Tambahkan PIC Ruangan"
      description="Pilih ruangan lalu petakan lecturer/admin sebagai PIC untuk ruangan tersebut."
      icon={<Plus className="h-5 w-5" />}
      contentClassName={`${USER_MODAL_WIDTH_CLASS} gap-0 p-0 [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]`}
    >
      <form className="space-y-4 px-5 py-4 sm:px-6" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-xs font-medium">Ruangan</label>
          <select
            value={selectedRoomId}
            onChange={(event) => {
              setSelectedRoomId(event.target.value);
              setSelectedPicIds([]);
              setMessage("");
            }}
            className="h-9 w-full rounded-md border border-sky-300 bg-sky-50/60 px-3 text-sm shadow-sm outline-none focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-200"
            disabled={isLoadingRooms}
          >
            <option value="">{isLoadingRooms ? "Memuat ruangan..." : "Pilih ruangan"}</option>
            {rooms.map((roomOption) => (
              <option key={roomOption.id} value={roomOption.id}>
                {roomOption.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Cari PIC</label>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nama, role, atau department"
            className="border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
            disabled={isLoadingPics}
          />
        </div>

        {selectedPicChips.length ? (
          <div className="flex flex-wrap gap-2">
            {selectedPicChips.map((user) => (
              <span
                key={user.id}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-900"
              >
                <span className="truncate">{user.name}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 text-sky-700 hover:bg-sky-200"
                  onClick={() =>
                    setSelectedPicIds((prev) => prev.filter((id) => id !== user.id))
                  }
                  aria-label={`Hapus ${user.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="max-h-64 overflow-y-auto rounded-md border border-sky-200 bg-white">
          {filteredPicUsers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Tidak ada lecturer/admin yang bisa dipilih.
            </div>
          ) : (
            filteredPicUsers.map((user) => {
              const checked = selectedPicSet.has(user.id);
              return (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-start gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-sky-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setSelectedPicIds((prev) =>
                        event.target.checked
                          ? [...prev, user.id]
                          : prev.filter((id) => id !== user.id),
                      );
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {[user.role, user.department].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {(roomOptionsError || picUsersError || roomDetailError) ? (
          <InlineErrorAlert>
            {roomOptionsError || picUsersError || roomDetailError}
          </InlineErrorAlert>
        ) : null}
        {message ? <InlineErrorAlert>{message}</InlineErrorAlert> : null}
        {errorMessage ? <InlineErrorAlert>{errorMessage}</InlineErrorAlert> : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingRoomDetail || !selectedRoomId}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? "Menyimpan..." : "Simpan PIC Ruangan"}
          </Button>
        </DialogFooter>
      </form>
    </AdminDetailDialogShell>
  );
}
