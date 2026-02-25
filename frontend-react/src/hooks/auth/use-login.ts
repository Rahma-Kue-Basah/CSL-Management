import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_AUTH_LOGIN, API_AUTH_USER_PROFILE } from "@/constants/api";
import { authFetch, setAccessTokens, setRefreshToken } from "@/lib/auth";
import { getCookieValue, setCookieValue } from "@/lib/cookies";

type LoginStatus = "idle" | "submitting" | "success" | "error";

type LoginFormData = {
  username: string;
  password: string;
};

type LoginResponse = {
  access_token?: string;
  access?: string;
  refresh_token?: string;
  refresh?: string;
  user?: unknown;
  non_field_errors?: string[];
  detail?: string;
};

type ProfileResponse = {
  id?: string | number;
  full_name?: string;
  username?: string;
  email?: string;
  role?: string | null;
  department?: string | null;
  batch?: string | number | null;
  id_number?: string | null;
  user_type?: string | null;
};

type ProfileCookie = {
  id?: string | number;
  name: string;
  email: string;
  role: string | null;
  department: string | null;
  batch: string | number | null;
  id_number: string | null;
  user_type: string | null;
  canResetPassword: boolean;
};

export function useLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [status, setStatus] = useState<LoginStatus>("idle");
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
      const response = await fetch(API_AUTH_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (response.ok) {
        setStatus("success");

        if (data.access_token || data.access) {
          setAccessTokens(data.access_token || data.access);
        }

        if (data.refresh_token || data.refresh) {
          setRefreshToken(data.refresh_token || data.refresh);
        }

        if (data.user) {
            setCookieValue("user", JSON.stringify(data.user), {
              expires: 1,
              secure: import.meta.env.PROD,
              sameSite: "lax",
            });
        }

        try {
          const profileResponse = await authFetch(API_AUTH_USER_PROFILE, {
            credentials: "include",
          });

          if (profileResponse.ok) {
            const profileData = (await profileResponse.json()) as ProfileResponse;
            const hasAccessToken = Boolean(
              getCookieValue("access_token") || getCookieValue("access"),
            );
            const nextProfile: ProfileCookie = {
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
            setCookieValue("profile", JSON.stringify(nextProfile), {
              expires: 1,
              secure: import.meta.env.PROD,
              sameSite: "lax",
            });
          }
        } catch (error) {
          console.error("Profile fetch after login error:", error);
        }

        router.push("/dashboard");
      } else {
        setStatus("error");
        setFormData({ username: "", password: "" });
        if (data.non_field_errors?.[0]) {
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
