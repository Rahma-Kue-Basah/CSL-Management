import { useState } from "react";
import { API_AUTH_PASSWORD_RESET } from "@/constants/api";

export function useForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    setEmail(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setStatus("submitting");

    try {
      const response = await fetch(API_AUTH_PASSWORD_RESET, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        if (data?.detail) {
          setErrorMessage(data.detail);
        } else if (data?.email) {
          setErrorMessage(data.email[0]);
        } else {
          setErrorMessage("Gagal mengirim email reset. Coba lagi.");
        }
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Terjadi kesalahan jaringan. Coba lagi.");
      console.error("Forgot password error:", error);
    }
  };

  return {
    email,
    status,
    errorMessage,
    handleChange,
    handleSubmit,
  };
}
