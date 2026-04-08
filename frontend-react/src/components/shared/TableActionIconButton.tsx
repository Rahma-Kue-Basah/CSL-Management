"use client";

import type { ComponentProps, ReactNode } from "react";

import { ActionTooltip } from "@/components/shared/ActionTooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core/utils";

type TableActionIconButtonProps = {
  label: string;
  icon: ReactNode;
} & ComponentProps<typeof Button>;

export function TableActionIconButton({
  label,
  icon,
  className,
  size = "sm",
  ...props
}: TableActionIconButtonProps) {
  return (
    <ActionTooltip label={label}>
      <Button
        size={size}
        className={cn(
        size === "sm" ? "h-8" : undefined,
          "cursor-pointer",
          className,
        )}
        {...props}
      >
        {icon}
      </Button>
    </ActionTooltip>
  );
}
