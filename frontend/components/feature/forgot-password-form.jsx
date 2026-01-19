"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useForgotPassword } from "@/hooks/use-forgot-password";
import { Loader2 } from "lucide-react";

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
        <div className="flex flex-col items-center gap-1 text-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo/stem-name 2.png"
              alt="CSL USE Logo"
              width={220}
              height={24}
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
          <p className="text-muted-foreground text-sm py-4">
            Masukkan email untuk menerima link reset password
          </p>
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
            <FieldDescription className="text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-2">
              {errorMessage}
            </FieldDescription>
          </Field>
        )}

        {status === "success" && (
          <Field>
            <FieldDescription className="text-green-600 border border-green-200 bg-green-50 rounded-md px-3 py-2">
              Jika email terdaftar, link reset password akan dikirim. Cek inbox atau spam.
            </FieldDescription>
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
