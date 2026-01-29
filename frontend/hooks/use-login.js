import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  API_AUTH_LOGIN,
  API_AUTH_USER_PROFILE,
} from "@/constants/api";
import { authFetch, setAccessTokens, setRefreshToken } from "@/lib/auth-fetch";
import { getCookieValue, setCookieValue } from "@/lib/cookies";

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
          setAccessTokens(data.access_token || data.access);
        }

        if (data.refresh_token || data.refresh) {
          setRefreshToken(data.refresh_token || data.refresh);
        }

        // Simpan user info jika ada
        if (data.user) {
          setCookieValue("user", JSON.stringify(data.user), {
            expires: 1,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
        }

        try {
          const profileResponse = await authFetch(API_AUTH_USER_PROFILE, {
            credentials: "include",
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const hasAccessToken = Boolean(
              getCookieValue("access_token") || getCookieValue("access"),
            );
            const nextProfile = {
              id: profileData.id,
              name: profileData.full_name || profileData.username || "User",
              email: profileData.email || "",
              role: profileData.role ?? null,
              department: profileData.department ?? null,
              batch: profileData.batch ?? null,
              id_number: profileData.id_number ?? null,
              user_type: profileData.user_type ?? null,
              canResetPassword: hasAccessToken,
            };
            window.localStorage.setItem("profile", JSON.stringify(nextProfile));
          }
        } catch (error) {
          console.error("Profile fetch after login error:", error);
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
