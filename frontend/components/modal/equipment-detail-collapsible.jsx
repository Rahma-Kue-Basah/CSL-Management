"use client";

import { useEffect, useMemo } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  ClipboardList,
  Hash,
  Layers,
  Package,
  Wrench,
  Image as ImageIcon,
  FileText,
} from "lucide-react";

function InfoRow({
  icon: Icon,
  label,
  value,
  editable = false,
  editing = false,
  name,
  onChange,
  type = "text",
  options = [],
}) {
  const showSelect = editable && editing && type === "select";
  const showInput = editable && editing && !showSelect;

  return (
    <div className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {showSelect ? (
          <select
            name={name}
            value={value ?? ""}
            onChange={onChange}
            disabled={!editing}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
          >
            <option value="">Pilih {label.toLowerCase()}</option>
            {options.map((opt) =>
              typeof opt === "string" ? (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ) : (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ),
            )}
          </select>
        ) : showInput ? (
          <input
            name={name}
            value={value ?? ""}
            onChange={onChange}
            disabled={!editing}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
          />
        ) : (
          <div className="text-sm font-medium break-words whitespace-pre-wrap leading-snug">
            {value || "—"}
          </div>
        )}
      </div>
    </div>
  );
}

export function EquipmentDetailCollapsible({
  open,
  onOpenChange,
  selectedEquipment,
  editForm,
  isEditing,
  isUpdating,
  onEditStart,
  onCancel,
  onSave,
  onChange,
  onImageChange,
  roomOptions,
  categoryOptions,
  moveableOptions,
}) {
  const imageUrl = selectedEquipment?.imageDetail?.url || "";
  const previewUrl = useMemo(() => {
    if (editForm?.imageFile) {
      return URL.createObjectURL(editForm.imageFile);
    }
    return "";
  }, [editForm?.imageFile]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);
  const roomLabel =
    selectedEquipment?.roomDetail?.name || selectedEquipment?.room || "";
  const moveableLabel = selectedEquipment?.isMoveable ? "Ya" : "Tidak";

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="fixed right-4 top-20 z-40 w-[420px] max-w-[95vw] md:right-60 data-[state=closed]:-translate-y-[320%] data-[state=open]:translate-y-0 data-[state=closed]:pointer-events-none transition-transform duration-300 ease-out"
    >
      <div className="rounded-lg border bg-card shadow-lg ring-1 ring-black/5">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">Detail Equipment</p>
          {open ? (
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X size={16} />
            </Button>
          ) : null}
        </div>

        <CollapsibleContent asChild>
          <div className="border-t px-4 py-4 max-h-[65vh] overflow-y-auto space-y-4">
            {selectedEquipment ? (
              <>
                <div className="space-y-2">
                  <p className="text-base font-semibold">
                    {selectedEquipment.name || "—"}
                  </p>
                  {(isEditing && previewUrl) || imageUrl ? (
                    <div className="relative overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={isEditing && previewUrl ? previewUrl : imageUrl}
                        alt={selectedEquipment.name || "Equipment image"}
                        className="h-40 w-full object-cover"
                      />
                      {isEditing ? (
                        <label className="absolute bottom-2 right-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/90 px-3 py-2 text-xs font-medium shadow-sm">
                          <ImageIcon className="h-4 w-4" />
                          <span>Ganti gambar</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onImageChange}
                          />
                        </label>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Tidak ada gambar
                    </div>
                  )}
                  {isEditing && editForm?.imageFile ? (
                    <span className="text-xs text-muted-foreground">
                      {editForm.imageFile.name}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <InfoRow
                    icon={ClipboardList}
                    label="Nama"
                    value={isEditing ? editForm.name : selectedEquipment.name}
                    editable
                    editing={isEditing}
                    name="name"
                    onChange={onChange}
                  />
                  <InfoRow
                    icon={Hash}
                    label="Jumlah"
                    value={isEditing ? editForm.quantity : selectedEquipment.quantity}
                    editable
                    editing={isEditing}
                    name="quantity"
                    onChange={onChange}
                  />
                  <InfoRow
                    icon={Layers}
                    label="Kategori"
                    value={
                      isEditing
                        ? editForm.category
                        : selectedEquipment.category
                    }
                    editable
                    editing={isEditing}
                    name="category"
                    onChange={onChange}
                    type="select"
                    options={categoryOptions}
                  />
                  <InfoRow
                    icon={Package}
                    label="Ruangan"
                    value={isEditing ? editForm.roomId : roomLabel}
                    editable
                    editing={isEditing}
                    name="roomId"
                    onChange={onChange}
                    type="select"
                    options={roomOptions}
                  />
                  <InfoRow
                    icon={Wrench}
                    label="Moveable"
                    value={isEditing ? editForm.isMoveable : moveableLabel}
                    editable
                    editing={isEditing}
                    name="isMoveable"
                    onChange={onChange}
                    type="select"
                    options={moveableOptions}
                  />
                  <InfoRow
                    icon={FileText}
                    label="Deskripsi"
                    value={
                      isEditing
                        ? editForm.description
                        : selectedEquipment.description
                    }
                    editable
                    editing={isEditing}
                    name="description"
                    onChange={onChange}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm font-semibold">Edit Equipment</p>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <Button size="sm" variant="secondary" onClick={onCancel}>
                        Batal
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant={isEditing ? "default" : "outline"}
                      onClick={() => {
                        if (isEditing) {
                          onSave();
                        } else {
                          onEditStart();
                        }
                      }}
                      disabled={isUpdating}
                    >
                      {isEditing
                        ? isUpdating
                          ? "Menyimpan..."
                          : "Simpan"
                        : "Edit"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Klik "View Detail" untuk melihat informasi.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default EquipmentDetailCollapsible;
