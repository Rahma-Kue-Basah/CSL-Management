"use client";

import { useParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/feature/reset-password-form";

export default function ResetPasswordPage() {
  const params = useParams();
  return <ResetPasswordForm uid={params.uid} token={params.token} />;
}
