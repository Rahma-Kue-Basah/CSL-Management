import { useState } from "react";
import { API_AUTH_REGISTER } from "@/constants/api";

type SignupStatus = "idle" | "submitting" | "success" | "error";

type SignupFormData = {
  fullName: string;
  institution: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type SignupErrorResponse = {
  email?: string[];
  username?: string[];
  detail?: string;
  non_field_errors?: string[];
};

export function useSignupGuest() {
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: "",
    institution: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState<SignupStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
          institution: formData.institution,
          email: formData.email,
          username: emailUsername,
          password1: formData.password,
          password2: formData.confirmPassword,
        }),
      });

      if (response.ok) {
        setStatus("success");
        setFormData({
          fullName: "",
          institution: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        setStatus("error");

        let message = "Gagal membuat akun. Periksa data dan coba lagi.";

        try {
          const data = (await response.json()) as SignupErrorResponse;

          const isEmailDuplicate =
            data?.email &&
            Array.isArray(data.email) &&
            data.email.includes(
              "User is already registered with this e-mail address.",
            );

          const isUsernameDuplicate =
            data?.username &&
            Array.isArray(data.username) &&
            data.username.includes("A user with that username already exists.");

          if (isEmailDuplicate || isUsernameDuplicate) {
            message = "Akun sudah terdaftar. Harap login.";
          } else if (typeof data.detail === "string") {
            message = data.detail;
          } else if (typeof data.non_field_errors?.[0] === "string") {
            message = data.non_field_errors[0];
          }
        } catch (parseError) {
          console.error("Failed to parse signup error response:", parseError);
        }

        setErrorMessage(message);
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
