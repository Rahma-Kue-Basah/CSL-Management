import { useState } from "react";
import { API_AUTH_REGISTER } from "@/constants/api";

export function useSignupGuest() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
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

    const emailUsername = formData.email.split("@")[0] || "";

    if (formData.password !== formData.confirmPassword) {
      setStatus("error");
      setErrorMessage("Password dan konfirmasi password tidak sama.");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch(API_AUTH_REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          username: emailUsername,
          password1: formData.password,
          password2: formData.confirmPassword,
        }),
      });

      if (response.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage("Gagal membuat akun. Periksa data dan coba lagi.");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Terjadi kesalahan jaringan. Coba lagi.");
      console.error("Signup error:", error);
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
