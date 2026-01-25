"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useForgotPassword } from "@/hooks/use-forgot-password";
import { Loader2 } from "lucide-react";
import { AlertMessage } from "@/components/ui/alert-message";

export function ForgotPasswordForm({ className, ...props }) {
  const { email, status, errorMessage, handleChange, handleSubmit } =
    useForgotPassword();

  useEffect(() => {
    if (status === "success") {
      // keep user on page, message shown
    }
  }, [status]);

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center text-center gap-2 mb-4">
          <h1 className="text-2xl font-semibold">Lupa Password</h1>
          <div>
            <p className="text-muted-foreground text-sm">
              Masukkan email untuk menerima link reset password
            </p>
          </div>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            className="placeholder:text-muted-foreground/60"
            required
            value={email}
            onChange={handleChange}
          />
        </Field>

        {status === "error" && (
          <Field>
            <AlertMessage variant="error">
              {errorMessage}
            </AlertMessage>
          </Field>
        )}

        {status === "success" && (
          <Field>
            <AlertMessage variant="success">
              Jika email terdaftar, link reset password akan dikirim. Cek inbox atau spam.
            </AlertMessage>
          </Field>
        )}

        <Field>
          <Button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim Link Reset"
            )}
          </Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            Sudah ingat password?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
