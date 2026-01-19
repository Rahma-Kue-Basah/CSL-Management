import { useState } from "react";
import { API_AUTH_PASSWORD_RESET_CONFIRM } from "@/constants/api";

export function useResetPassword({ uid, token }) {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setStatus("submitting");

    try {
      const response = await fetch(API_AUTH_PASSWORD_RESET_CONFIRM, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid,
          token,
          new_password1: formData.newPassword,
          new_password2: formData.confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        if (data?.detail) {
          setErrorMessage(data.detail);
        } else if (data?.new_password2) {
          setErrorMessage(data.new_password2[0]);
        } else if (data?.new_password1) {
          setErrorMessage(data.new_password1[0]);
        } else {
          setErrorMessage("Reset password gagal. Coba lagi.");
        }
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Terjadi kesalahan jaringan. Coba lagi.");
      console.error("Reset password error:", error);
    }
  };

  return {
    formData,
    status,
    errorMessage,
    handleChange,
    handleSubmit,
  };
}
