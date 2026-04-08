"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Box } from "lucide-react";
import { toast } from "sonner";

import RelatedEquipmentDetailDialog from "@/components/admin/history/RelatedEquipmentDetailDialog";
import AdminDetailActions from "@/components/shared/AdminDetailActions";
import AdminDetailDialogShell from "@/components/shared/AdminDetailDialogShell";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import InlineErrorAlert from "@/components/shared/InlineErrorAlert";
import { Input } from "@/components/ui/input";
import { useEquipmentOptions } from "@/hooks/shared/resources/equipments/use-equipment-options";
import type { SoftwareRow } from "@/hooks/shared/resources/softwares/use-softwares";
import { useDeleteSoftware } from "@/hooks/shared/resources/softwares/use-delete-software";
import { useUpdateSoftware } from "@/hooks/shared/resources/softwares/use-update-software";

const INVENTORY_MODAL_WIDTH_CLASS =
  "w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-[50vw] sm:max-w-[960px] sm:min-w-[720px] sm:max-w-none";

type AdminSoftwareDetailDialogProps = {
  open: boolean;
  software: SoftwareRow | null;
  isLoading?: boolean;
  error?: string;
  canManage?: boolean;
  initialMode?: "view" | "edit";
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  onDeleted: () => void;
};

function DetailField({
  label,
  value,
  editable = false,
  onChange,
  type = "text",
  onClick,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  type?: "text" | "number" | "date";
  onClick?: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-700">{label}</p>
      {editable ? (
        <Input
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className="border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
        />
      ) : onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-sky-700 transition hover:text-sky-800"
        >
          {value || "-"}
          <ArrowUpRight className="ml-2 inline h-3.5 w-3.5 align-text-top text-sky-500" />
        </button>
      ) : (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {value || "-"}
        </div>
      )}
    </div>
  );
}

export default function AdminSoftwareDetailDialog({
  open,
  software,
  isLoading = false,
  error = "",
  canManage = true,
  initialMode = "view",
  onOpenChange,
  onUpdated,
  onDeleted,
}: AdminSoftwareDetailDialogProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [relatedEquipmentId, setRelatedEquipmentId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    version: "",
    licenseInfo: "",
    licenseExpiration: "",
    equipmentId: "",
    description: "",
  });
  const {
    equipments,
    isLoading: isLoadingEquipments,
    error: equipmentError,
  } = useEquipmentOptions("", "", true, undefined, "Computer");
  const {
    updateSoftware,
    isSubmitting,
    errorMessage: updateErrorMessage,
    setErrorMessage: setUpdateErrorMessage,
  } = useUpdateSoftware();
  const {
    deleteSoftware,
    isDeleting,
    errorMessage: deleteErrorMessage,
    setErrorMessage: setDeleteErrorMessage,
  } = useDeleteSoftware();

  useEffect(() => {
    if (!open || !software) return;
    setFormData({
      name: software.name,
      version: software.version,
      licenseInfo: software.licenseInfo,
      licenseExpiration: software.licenseExpiration,
      equipmentId: software.equipmentId,
      description: software.description,
    });
    setIsEditing(initialMode === "edit" && canManage);
    setConfirmDeleteOpen(false);
    setUpdateErrorMessage("");
    setDeleteErrorMessage("");
  }, [canManage, initialMode, open, setDeleteErrorMessage, setUpdateErrorMessage, software]);

  const resetState = () => {
    setConfirmDeleteOpen(false);
    setIsEditing(false);
    setUpdateErrorMessage("");
    setDeleteErrorMessage("");
    setFormData({
      name: "",
      version: "",
      licenseInfo: "",
      licenseExpiration: "",
      equipmentId: "",
      description: "",
    });
  };

  const handleSave = async () => {
    if (!software) return;
    setUpdateErrorMessage("");

    if (!formData.name.trim()) return setUpdateErrorMessage("Nama software wajib diisi.");
    if (!formData.equipmentId) return setUpdateErrorMessage("Peralatan wajib dipilih.");

    const result = await updateSoftware(software.id, formData);
    if (!result.ok) return;

    setIsEditing(false);
    onUpdated();
    toast.success("Software berhasil diperbarui.");
  };

  const handleDelete = async () => {
    if (!software) return;
    setDeleteErrorMessage("");
    const result = await deleteSoftware(software.id);
    if (!result.ok) return;
    setConfirmDeleteOpen(false);
    onDeleted();
    onOpenChange(false);
    resetState();
    toast.success("Software berhasil dihapus.");
  };

  return (
    <AdminDetailDialogShell
      open={open}
      onOpenChange={onOpenChange}
      onCloseReset={() => {
        resetState();
        setRelatedEquipmentId(null);
      }}
      title="Detail Software"
      description="Tinjau informasi software dan lakukan perubahan bila diperlukan."
      icon={<Box className="h-5 w-5" />}
      contentClassName={`${INVENTORY_MODAL_WIDTH_CLASS} max-h-[90vh] min-w-0 gap-0 overflow-hidden p-0`}
    >
      <div className="space-y-4 px-5 py-4 sm:px-6">
        {error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-slate-50/80 px-4 py-3">
              <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="h-10 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        ) : !software ? (
          <div className="rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
            Data software tidak ditemukan.
          </div>
        ) : (
          <div className="max-h-[calc(90vh-7rem)] overflow-y-auto pr-1 pb-2">
            <div className="space-y-4">
              <div className="rounded-xl border bg-slate-50/80 px-4 py-3">
                <p className="text-lg font-semibold text-slate-900">{software.name}</p>
                <p className="text-sm text-muted-foreground">{software.equipmentName}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailField
                  label="Nama"
                  value={isEditing ? formData.name : software.name}
                  editable={isEditing}
                  onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                />
                <DetailField
                  label="Versi"
                  value={isEditing ? formData.version : software.version}
                  editable={isEditing}
                  onChange={(value) => setFormData((prev) => ({ ...prev, version: value }))}
                />
                <DetailField
                  label="Lisensi"
                  value={isEditing ? formData.licenseInfo : software.licenseInfo}
                  editable={isEditing}
                  onChange={(value) => setFormData((prev) => ({ ...prev, licenseInfo: value }))}
                />
                <DetailField
                  label="Expired"
                  value={isEditing ? formData.licenseExpiration : software.licenseExpiration}
                  editable={isEditing}
                  type="date"
                  onChange={(value) => setFormData((prev) => ({ ...prev, licenseExpiration: value }))}
                />
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs font-medium text-slate-700">Peralatan</p>
                  {isEditing ? (
                    <select
                      value={formData.equipmentId}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, equipmentId: event.target.value }))
                      }
                      className="h-9 w-full rounded-md border border-sky-300 bg-sky-50/60 px-3 text-sm shadow-sm outline-none focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-200"
                      disabled={isLoadingEquipments}
                    >
                      <option value="">
                        {isLoadingEquipments ? "Memuat peralatan..." : "Pilih peralatan"}
                      </option>
                      {equipments.map((equipment) => (
                        <option key={equipment.id} value={equipment.id}>
                          {equipment.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={
                        software.equipmentId ? () => setRelatedEquipmentId(software.equipmentId) : undefined
                      }
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-sky-700 transition hover:text-sky-800 disabled:cursor-default disabled:text-slate-700"
                      disabled={!software.equipmentId}
                    >
                      {software.equipmentName || "-"}
                      {software.equipmentId ? (
                        <ArrowUpRight className="ml-2 inline h-3.5 w-3.5 align-text-top text-sky-500" />
                      ) : null}
                    </button>
                  )}
                  {equipmentError ? <p className="text-xs text-destructive">{equipmentError}</p> : null}
                </div>

                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs font-medium text-slate-700">Deskripsi</p>
                  {isEditing ? (
                    <textarea
                      value={formData.description}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, description: event.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-md border border-sky-300 bg-sky-50/60 px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-sky-600 focus-visible:ring-[3px] focus-visible:ring-sky-200"
                    />
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {software.description || "-"}
                    </div>
                  )}
                </div>
              </div>

              {updateErrorMessage ? <InlineErrorAlert>{updateErrorMessage}</InlineErrorAlert> : null}
              {deleteErrorMessage ? <InlineErrorAlert>{deleteErrorMessage}</InlineErrorAlert> : null}

              {canManage ? (
                <AdminDetailActions
                  isEditing={isEditing}
                  isSubmitting={isSubmitting}
                  showDeleteAction
                  deleteLabel="Hapus Software"
                  onEdit={() => setIsEditing(true)}
                  onCancelEdit={() => {
                    setIsEditing(false);
                    setUpdateErrorMessage("");
                    setFormData({
                      name: software.name,
                      version: software.version,
                      licenseInfo: software.licenseInfo,
                      licenseExpiration: software.licenseExpiration,
                      equipmentId: software.equipmentId,
                      description: software.description,
                    });
                  }}
                  onSave={() => void handleSave()}
                  onDelete={() => setConfirmDeleteOpen(true)}
                />
              ) : null}

              {!isEditing && canManage ? (
                <ConfirmDeleteDialog
                  open={confirmDeleteOpen}
                  onOpenChange={setConfirmDeleteOpen}
                  size="sm"
                  headerClassName="place-items-start text-left"
                  footerClassName="sm:justify-start"
                  title="Hapus software?"
                  description={`Software ${software.name} akan dihapus.`}
                  isDeleting={isDeleting}
                  onConfirm={() => void handleDelete()}
                />
              ) : null}
            </div>
          </div>
        )}
      </div>

      <RelatedEquipmentDetailDialog
        open={Boolean(relatedEquipmentId)}
        equipmentId={relatedEquipmentId}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setRelatedEquipmentId(null);
        }}
      />
    </AdminDetailDialogShell>
  );
}
