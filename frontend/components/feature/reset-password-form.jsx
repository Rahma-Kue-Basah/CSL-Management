"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "@/hooks/use-reset-password";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AlertMessage } from "@/components/ui/alert-message";

export function ResetPasswordForm({ uid, token, className, ...props }) {
  const router = useRouter();
  const { formData, status, errorMessage, handleChange, handleSubmit } =
    useResetPassword({ uid, token });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (status === "success") {
      const timeoutId = setTimeout(() => {
        router.push("/login");
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [status, router]);

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center text-center gap-2 mb-4">
          <h1 className="text-2xl font-semibold">Buat Password Baru</h1>
          <div>
            <p className="text-muted-foreground text-sm">
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
          <FieldLabel htmlFor="confirm-password">
            Konfirmasi Password Baru
          </FieldLabel>
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
