"use client";

import { useState } from "react";

import { API_AUTH_PASSWORD_CHANGE } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type ChangePasswordStatus = "idle" | "submitting" | "success" | "error";

type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ChangePasswordErrorResponse = {
  detail?: string;
  old_password?: string[];
  new_password1?: string[];
  new_password2?: string[];
};

export function useChangePassword() {
  const [formData, setFormData] = useState<ChangePasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState<ChangePasswordStatus>("idle");
  const [message, setMessage] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!formData.currentPassword) {
      setStatus("error");
      setMessage("Password lama wajib diisi.");
      return;
    }
    if (!formData.newPassword) {
      setStatus("error");
      setMessage("Password baru wajib diisi.");
      return;
    }
    if (!formData.confirmPassword) {
      setStatus("error");
      setMessage("Konfirmasi password baru wajib diisi.");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setStatus("error");
      setMessage("Konfirmasi password baru tidak cocok.");
      return;
    }

    setStatus("submitting");

    try {
      const response = await authFetch(API_AUTH_PASSWORD_CHANGE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          old_password: formData.currentPassword,
          new_password1: formData.newPassword,
          new_password2: formData.confirmPassword,
        }),
      });

      const data = (await response
        .json()
        .catch(() => ({}))) as ChangePasswordErrorResponse;

      if (!response.ok) {
        const errorMessage =
          data?.detail ||
          data?.old_password?.[0] ||
          data?.new_password1?.[0] ||
          data?.new_password2?.[0] ||
          `Gagal mengubah password (${response.status}).`;
        setStatus("error");
        setMessage(errorMessage);
        return;
      }

      setStatus("success");
      setMessage("Password berhasil diubah.");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setStatus("error");
      setMessage("Terjadi kesalahan jaringan. Coba lagi.");
    }
  };

  return {
    formData,
    status,
    message,
    setMessage,
    handleChange,
    handleSubmit,
  };
}

export default useChangePassword;
