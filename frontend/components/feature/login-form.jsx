"use client";

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
import { useLogin } from "@/hooks/use-login";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function LoginForm({ className, ...props }) {
  const { formData, status, errorMessage, handleChange, handleSubmit } =
    useLogin();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === "error" && errorMessage) {
      toast.error(errorMessage);
    }
  }, [status, errorMessage]);

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
              width={260}
              height={24}
            />
          </Link>
          <p className="text-muted-foreground text-sm py-4">
            Enter your email below to login to your account
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="username">Email</FieldLabel>
          <Input
            id="username"
            name="username"
            type="text"
            required
            value={formData.username}
            onChange={handleChange}
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={handleChange}
              className="pr-10"
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
          <Button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link href="/signup-guest" className="underline underline-offset-4">
              Sign up as Guest
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
