"use client";

import { useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEmailVerification } from "@/hooks/use-email-verification";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";

  const handleVerified = useCallback(() => {
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  }, [router]);

  const { status, resendStatus, resendVerification } = useEmailVerification({
    key: params.key,
    email,
    onVerified: handleVerified,
  });

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
            Verify your email to continue
          </p> 
        </div>

        {status === "verifying" && (
          <Field>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="size-24 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
              <FieldLabel>Verifying your email...</FieldLabel>
              <br/>
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
              <br/>
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
              <br/>
              <FieldDescription>{getDisplayMessage()}</FieldDescription>
              <div className="flex w-full flex-col gap-2">
                <Button
                  type="button"
                  onClick={resendVerification}
                  disabled={!email || resendStatus === "sending"}
                >
                  {resendStatus === "sending"
                    ? "Mengirim ulang..."
                    : "Kirim ulang verifikasi"}
                </Button>
                <FieldDescription>
                  {!email &&
                    "Email tidak ditemukan di URL. Tambahkan ?email=nama@email.com"}
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
