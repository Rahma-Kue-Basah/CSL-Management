"use client";

import { useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui";
import { useEmailVerification } from "@/hooks/auth";

type VerifyParams = {
  key?: string | string[];
};

export default function SignupGuestVerifyPage() {
  const params = useParams<VerifyParams>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";

  const handleVerified = useCallback(() => {
    window.setTimeout(() => {
      router.push("/login");
    }, 3000);
  }, [router]);

  const key = Array.isArray(params?.key) ? params.key[0] : params?.key;
  const { status, resendStatus, resendVerification } = useEmailVerification({
    key,
    email,
    onVerified: handleVerified,
  });
  const isResendDisabled = !email || resendStatus === "sending";

  const getDisplayMessage = () => {
    if (status === "success") {
      return "Mengarahkan ke login...";
    }

    if (status === "error") {
      return "Link verifikasi tidak valid atau sudah kedaluwarsa.";
    }

    return "Mohon tunggu sebentar.";
  };

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        {status === "verifying" && (
          <Field>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="size-24 animate-spin rounded-full border-2 border-muted border-t-primary" />
              <FieldLabel>Verifying your email...</FieldLabel>
              <br />
              <FieldDescription>Please wait a moment</FieldDescription>
            </div>
          </Field>
        )}

        {status === "success" && (
          <Field>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-24 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-12 w-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <FieldLabel>Email Verified!</FieldLabel>
              <br />
              <FieldDescription>{getDisplayMessage()}</FieldDescription>
            </div>
          </Field>
        )}

        {status === "error" && (
          <Field>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-24 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-12 w-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <FieldLabel>Verification Failed</FieldLabel>
              <br />
              <FieldDescription>{getDisplayMessage()}</FieldDescription>
              <div className="flex w-full flex-col gap-2">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!isResendDisabled) {
                      resendVerification();
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      !isResendDisabled &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      resendVerification();
                    }
                  }}
                  aria-disabled={isResendDisabled}
                  className={`text-sm font-medium underline underline-offset-4 ${
                    isResendDisabled
                      ? "cursor-not-allowed text-muted-foreground/70"
                      : "cursor-pointer text-primary"
                  }`}
                >
                  {resendStatus === "sending"
                    ? "Mengirim ulang..."
                    : "Kirim ulang verifikasi"}
                </span>
                <FieldDescription>
                  {resendStatus === "sent" &&
                    "Link verifikasi baru sudah dikirim. Cek inbox/spam kamu."}
                  {resendStatus === "error" &&
                    email &&
                    "Gagal mengirim ulang. Coba beberapa saat lagi."}
                </FieldDescription>
              </div>
            </div>
          </Field>
        )}
      </FieldGroup>
    </div>
  );
}
