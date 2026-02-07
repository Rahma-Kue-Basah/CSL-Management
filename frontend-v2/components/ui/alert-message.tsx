"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type AlertMessageProps = {
  variant?: "error" | "success";
  children: ReactNode;
  className?: string;
  onClose?: () => void;
  dismissible?: boolean;
};

export function AlertMessage({
  variant = "error",
  children,
  className,
  onClose,
  dismissible = true,
}: AlertMessageProps) {
  const [visible, setVisible] = useState(true);
  const isSuccess = variant === "success";

  if (!visible) return null;

  const handleClose = () => {
    if (onClose) onClose();
    else setVisible(false);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm",
        isSuccess
          ? "border border-green-200 bg-green-50 text-green-700"
          : "border border-red-200 bg-red-50 text-red-600",
        className,
      )}
    >
      <div className="flex-1">{children}</div>
      {dismissible && (
        <button
          type="button"
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default AlertMessage;
