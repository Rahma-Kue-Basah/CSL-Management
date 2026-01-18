"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_AUTH_LOGIN_GOOGLE } from "@/constants/api";
import { useSignupGuest } from "@/hooks/use-signup-guest";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SignupGuestForm({ className, ...props }) {
  const { formData, status, errorMessage, handleChange, handleSubmit } =
    useSignupGuest();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === "error" && errorMessage) {
      toast.error(errorMessage);
    } else if (status === "success") {
      toast.success("Registrasi berhasil. Cek email untuk verifikasi akun.");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }
  }, [status, errorMessage, router]);

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo/stem-name 2.png"
              alt="CSL USE Logo"
              width={220}
              height={24}
            />
          </Link>
          <p className="text-muted-foreground text-sm py-4">
            Create your account to get started <i>as Guest</i>
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="fullname">Nama Lengkap</FieldLabel>
          <Input
            id="fullname"
            name="fullName"
            type="text"
            placeholder="Masukkan nama lengkap"
            className="placeholder:text-muted-foreground/50"
            required
            value={formData.fullName}
            onChange={handleChange}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Masukkan email"
            className="placeholder:text-muted-foreground/50"
            required
            value={formData.email}
            onChange={handleChange}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Buat password"
              required
              value={formData.password}
              onChange={handleChange}
              className="pr-10 placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">
            Konfirmasi Password
          </FieldLabel>
          <div className="relative">
            <Input
              id="confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Ulangi password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="pr-10 placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </Field>

        <Field>
          <Button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mendaftar...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </Field>

        <FieldSeparator>Or</FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={() => (window.location.href = API_AUTH_LOGIN_GOOGLE)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-5 h-5 mr-2"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
