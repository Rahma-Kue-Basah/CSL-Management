import { useState } from "react";
import { API_AUTH_PASSWORD_RESET_CONFIRM } from "@/constants/api";

type ResetPasswordStatus = "idle" | "submitting" | "success" | "error";

type ResetPasswordParams = {
  uid: string;
  token: string;
};

type ResetPasswordFormData = {
  newPassword: string;
  confirmPassword: string;
};

type ResetPasswordErrorResponse = {
  detail?: string;
  new_password1?: string[];
  new_password2?: string[];
};

export function useResetPassword({ uid, token }: ResetPasswordParams) {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    newPassword: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState<ResetPasswordStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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

      const data = (await response
        .json()
        .catch(() => ({}))) as ResetPasswordErrorResponse;

      if (response.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        if (data?.detail) {
          setErrorMessage(data.detail);
        } else if (data?.new_password2?.[0]) {
          setErrorMessage(data.new_password2[0]);
        } else if (data?.new_password1?.[0]) {
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
