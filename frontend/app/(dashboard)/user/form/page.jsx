"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROLE_OPTIONS } from "@/constants/roles";
import { DEPARTMENT_VALUES } from "@/constants/departments";
import { BATCH_VALUES } from "@/constants/batches";
import { USER_TYPE_SELECT_OPTIONS } from "@/constants/user-types";
import { useCreateUser } from "@/hooks/use-create-user";

export default function NewUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "",
    department: "",
    batch: "",
    idNumber: "",
    userType: "",
  });
  const { createUser, isSubmitting, errorMessage, setErrorMessage } =
    useCreateUser();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.fullName.trim()) {
      setErrorMessage("Nama wajib diisi.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage("Email wajib diisi.");
      return;
    }

    if (!formData.password) {
      setErrorMessage("Password wajib diisi.");
      return;
    }

    const payload = {
      full_name: formData.fullName.trim(),
      email: formData.email.trim(),
      username: formData.email.trim().split("@")[0] || "user",
      password1: formData.password,
      password2: formData.password,
    };

    if (formData.role) payload.role = formData.role;
    if (formData.role === "STUDENT") {
      if (formData.department) payload.department = formData.department;
      if (formData.batch) payload.batch = formData.batch;
      if (formData.idNumber) payload.id_number = formData.idNumber;
    }
    if (formData.userType) payload.user_type = formData.userType;

    try {
      const result = await createUser(payload);
      if (result.ok) {
        router.push("/user");
        return;
      }
    } catch (error) {
      console.error("Create user error:", error);
      setErrorMessage(error.message || "Terjadi kesalahan jaringan. Coba lagi.");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="mx-auto text-center">
          <h1 className="text-2xl font-semibold">Tambah User</h1>
          <p className="text-sm text-muted-foreground">
            Buat akun baru untuk student, lecturer, atau role lainnya.
          </p>
        </div>
      </div>

        <div className="rounded-lg">
          <form
            className="mx-auto w-full max-w-xl space-y-4 rounded-lg border bg-card p-4 md:max-w-[50%]"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Nama Lengkap</label>
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                placeholder="Nama lengkap"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                placeholder="nim@student.prasetiyamulya.ac.id"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 pr-10 text-sm"
                  placeholder="Minimal 8 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">User Type</label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {USER_TYPE_SELECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

            <div className="grid gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option
                    key={option.value || option.label}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {formData.role === "STUDENT" ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium">ID Number</label>
                  <input
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    placeholder="Nomor identitas"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Pilih department</option>
                    {DEPARTMENT_VALUES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Batch</label>
                  <select
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Pilih batch</option>
                    {BATCH_VALUES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Menyimpan..." : "Buat User"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
