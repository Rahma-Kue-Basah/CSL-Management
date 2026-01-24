"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable alert block matching the registration error style.
 * Use variant="error" or "success".
 */
export function AlertMessage({ variant = "error", children, className }) {
  const isSuccess = variant === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
        isSuccess
          ? "border border-green-200 bg-green-50 text-green-700"
          : "border border-red-200 bg-red-50 text-red-600",
        className,
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{children}</span>
    </div>
  );
}

export default AlertMessage;
