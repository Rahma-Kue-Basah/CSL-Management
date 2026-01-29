"use client";

import { useState } from "react";
import { API_AUTH_PASSWORD_CHANGE } from "@/constants/api";
import { getCookieValue } from "@/lib/cookies";

export function useChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    if (e) e.preventDefault();
    setMessage("");
    if (form.newPassword !== form.confirmPassword) {
      setStatus("error");
      setMessage("Konfirmasi password tidak cocok.");
      return;
    }
    setStatus("submitting");
    try {
      const accessToken =
        getCookieValue("access_token") ||
        getCookieValue("access") ||
        (typeof window !== "undefined"
          ? window.localStorage.getItem("access_token")
          : null);

      const response = await fetch(API_AUTH_PASSWORD_CHANGE, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          old_password: form.currentPassword,
          new_password1: form.newPassword,
          new_password2: form.confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail =
          data?.detail ||
          data?.new_password2?.[0] ||
          data?.new_password1?.[0] ||
          data?.old_password?.[0] ||
          "Gagal mengubah password.";
        throw new Error(detail);
      }

      setStatus("success");
      setMessage("Password berhasil diubah.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Gagal mengubah password.");
    }
  };

  return {
    form,
    status,
    message,
    setMessage,
    handleChange,
    submit,
  };
}

export default useChangePassword;
