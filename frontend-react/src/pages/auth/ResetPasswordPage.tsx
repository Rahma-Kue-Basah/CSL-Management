"use client";

import { useParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type ResetPasswordParams = {
  uid?: string | string[];
  token?: string | string[];
};

export default function ResetPasswordPage() {
  const params = useParams<ResetPasswordParams>();
  const uid = Array.isArray(params?.uid) ? params.uid[0] : params?.uid || "";
  const token = Array.isArray(params?.token)
    ? params.token[0]
    : params?.token || "";

  return <ResetPasswordForm uid={uid} token={token} />;
}
