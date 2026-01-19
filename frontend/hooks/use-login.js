import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_AUTH_LOGIN } from "@/constants/api";
import Cookies from "js-cookie";

export function useLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
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
      const response = await fetch(API_AUTH_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in request
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");

        // Simpan token ke cookies
        if (data.access_token || data.access) {
          const accessToken = data.access_token || data.access;
          Cookies.set("access_token", accessToken, {
            expires: 1, // 1 day
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
        }

        if (data.refresh_token || data.refresh) {
          const refreshToken = data.refresh_token || data.refresh;
          Cookies.set("refresh_token", refreshToken, {
            expires: 7, // 7 days
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
        }

        // Simpan user info jika ada
        if (data.user) {
          Cookies.set("user", JSON.stringify(data.user), {
            expires: 1,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
        }

        // Redirect ke dashboard
        router.push("/dashboard");
      } else {
        setStatus("error");
        setFormData({ username: "", password: "" });
        // Handle error messages dari backend
        if (data.non_field_errors) {
          setErrorMessage(data.non_field_errors[0]);
        } else if (data.detail) {
          setErrorMessage(data.detail);
        } else {
          setErrorMessage("Login gagal. Periksa email dan password Anda.");
        }
      }
    } catch (error) {
      setStatus("error");
      setFormData({ username: "", password: "" });
      setErrorMessage("Terjadi kesalahan jaringan. Coba lagi.");
      console.error("Login error:", error);
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
