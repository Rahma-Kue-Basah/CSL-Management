import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_AUTH_LOGIN, API_AUTH_USER_PROFILE } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import {
  buildProfileFromApiResponse,
  persistProfileCache,
} from "@/hooks/profile/use-load-profile";

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
  non_field_errors?: string[];
  detail?: string;
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

        try {
          const profileResponse = await authFetch(API_AUTH_USER_PROFILE, {
            credentials: "include",
          });

          if (profileResponse.ok) {
            const profileData: unknown = await profileResponse.json();
            const nextProfile = buildProfileFromApiResponse(profileData);
            if (nextProfile) {
              persistProfileCache(nextProfile);
            }
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
