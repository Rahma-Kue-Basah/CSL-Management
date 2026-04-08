"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/core/utils";

type InlineErrorAlertProps = {
  children: ReactNode;
  className?: string;
};

export default function InlineErrorAlert({
  children,
  className,
}: InlineErrorAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive",
        className,
      )}
    >
      {children}
    </div>
  );
}
