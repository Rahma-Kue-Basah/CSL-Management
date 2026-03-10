"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { AlertMessage } from "@/components/ui/alert-message";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/hooks/auth/use-forgot-password";
import { cn } from "@/lib/utils";

type ForgotPasswordFormProps = ComponentPropsWithoutRef<"form">;

export default function ForgotPasswordPage({
  className,
  ...props
}: ForgotPasswordFormProps) {
  const { email, status, errorMessage, handleChange, handleSubmit } =
    useForgotPassword();

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold">Lupa Password</h1>
          <div>
            <p className="text-sm text-muted-foreground">
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
            <AlertMessage variant="error">{errorMessage}</AlertMessage>
          </Field>
        )}

        {status === "success" && (
          <Field>
            <AlertMessage variant="success">
              Jika email terdaftar, link reset password akan dikirim. Cek inbox
              atau spam.
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
