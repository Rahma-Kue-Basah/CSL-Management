"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useUpdateUserProfile } from "@/hooks/use-update-user-profile";

const EMPTY_FORM = {
  full_name: "",
  department: "",
  batch: "",
  id_number: "",
  role: "",
  user_type: "",
};

const normalizeValue = (value) => (value && value !== "-" ? value : "");

export function useUserProfileEditor({ selectedUser, setUsers, setSelectedUser }) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [detailMode, setDetailMode] = useState("view");
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const { updateUserProfile, isSubmitting, message, setMessage } =
    useUpdateUserProfile();

  useEffect(() => {
    if (!selectedUser) {
      setEditForm(EMPTY_FORM);
      setIsEditingProfile(false);
      setDetailMode("view");
      setMessage("");
      return;
    }

    setEditForm({
      full_name: normalizeValue(selectedUser.name),
      department: normalizeValue(selectedUser.department),
      batch: normalizeValue(selectedUser.batch),
      id_number: normalizeValue(selectedUser.idNumber),
      role: normalizeValue(selectedUser.role),
      user_type: normalizeValue(selectedUser.userType),
    });
    setIsEditingProfile(detailMode === "edit");
    setMessage("");
  }, [selectedUser, detailMode, setMessage]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileCancel = () => {
    if (!selectedUser) return;
    setEditForm({
      full_name: normalizeValue(selectedUser.name),
      department: normalizeValue(selectedUser.department),
      batch: normalizeValue(selectedUser.batch),
      id_number: normalizeValue(selectedUser.idNumber),
      role: normalizeValue(selectedUser.role),
      user_type: normalizeValue(selectedUser.userType),
    });
    setIsEditingProfile(false);
    setDetailMode("view");
    setMessage("");
  };

  const handleProfileSave = async () => {
    if (!selectedUser?.profileId) {
      toast.error("Profile ID tidak ditemukan.");
      return;
    }

    const payload = {
      full_name: editForm.full_name?.trim() || "",
      department: editForm.department || null,
      batch: editForm.batch || null,
      id_number: editForm.id_number || null,
      role: editForm.role || null,
      user_type: editForm.user_type || null,
    };

    const currentProfile = {
      id: selectedUser.profileId,
      name: normalizeValue(selectedUser.name),
      email: selectedUser.email,
      department: normalizeValue(selectedUser.department),
      batch: normalizeValue(selectedUser.batch),
      id_number: normalizeValue(selectedUser.idNumber),
      role: normalizeValue(selectedUser.role),
      user_type: normalizeValue(selectedUser.userType),
    };

    try {
      const updated = await updateUserProfile(
        selectedUser.profileId,
        payload,
        currentProfile,
      );

      const nextUser = {
        ...selectedUser,
        name: updated.name,
        department: updated.department || "-",
        batch: updated.batch || "-",
        idNumber: updated.id_number || "-",
        role: updated.role || "-",
        userType: updated.user_type || "-",
      };
      setSelectedUser(nextUser);
      setUsers((prev) =>
        prev.map((item) => (item.uid === selectedUser.uid ? nextUser : item)),
      );
      setIsEditingProfile(false);
      setDetailMode("view");
    } catch (error) {
      toast.error(error.message || "Gagal memperbarui profile.");
    }
  };

  const enterEditMode = () => {
    setDetailMode("edit");
    setIsEditingProfile(true);
  };

  const enterViewMode = () => {
    setDetailMode("view");
    setIsEditingProfile(false);
  };

  return {
    editForm,
    isEditingProfile,
    detailMode,
    isUpdating: isSubmitting,
    message,
    setMessage,
    setDetailMode,
    setIsEditingProfile,
    onChange: handleProfileChange,
    onCancel: handleProfileCancel,
    onSave: handleProfileSave,
    enterEditMode,
    enterViewMode,
  };
}

export default useUserProfileEditor;
