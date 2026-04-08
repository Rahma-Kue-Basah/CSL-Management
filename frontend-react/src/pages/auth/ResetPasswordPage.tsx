"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { AlertMessage } from "@/components/ui/alert-message";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "@/hooks/auth/use-reset-password";
import { cn } from "@/lib/core/utils";

type ResetPasswordParams = {
  uid?: string | string[];
  token?: string | string[];
};

type ResetPasswordFormProps = ComponentPropsWithoutRef<"form"> & {
  uid: string;
  token: string;
};

function ResetPasswordForm({
  uid,
  token,
  className,
  ...props
}: ResetPasswordFormProps) {
  const router = useRouter();
  const { formData, status, errorMessage, handleChange, handleSubmit } =
    useResetPassword({ uid, token });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (status === "success") {
      const timeoutId = window.setTimeout(() => {
        router.push("/login");
      }, 1500);
      return () => window.clearTimeout(timeoutId);
    }
  }, [status, router]);

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold">Buat Password Baru</h1>
          <div>
            <p className="text-sm text-muted-foreground">
              Buat password baru untuk akun Anda
            </p>
          </div>
        </div>

        <Field>
          <FieldLabel htmlFor="new-password">Password Baru</FieldLabel>
          <div className="relative">
            <Input
              id="new-password"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Buat password baru"
              className="pr-10 placeholder:text-muted-foreground/60"
              required
              value={formData.newPassword}
              onChange={handleChange}
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
          <FieldLabel htmlFor="confirm-password">Konfirmasi Password Baru</FieldLabel>
          <div className="relative">
            <Input
              id="confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Ulangi password baru"
              className="pr-10 placeholder:text-muted-foreground/60"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
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

        {status === "error" && (
          <Field>
            <AlertMessage variant="error">{errorMessage}</AlertMessage>
          </Field>
        )}

        {status === "success" && (
          <Field>
            <AlertMessage variant="success">
              Password berhasil direset. Mengarahkan ke login...
            </AlertMessage>
          </Field>
        )}

        <Field>
          <Button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

export default function ResetPasswordPage() {
  const params = useParams<ResetPasswordParams>();
  const uid = Array.isArray(params?.uid) ? params.uid[0] : params?.uid || "";
  const token = Array.isArray(params?.token)
    ? params.token[0]
    : params?.token || "";

  return <ResetPasswordForm uid={uid} token={token} />;
}
