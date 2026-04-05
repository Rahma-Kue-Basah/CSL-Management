"use client";

import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFilterCard } from "@/components/admin/admin-filter-card";
import InlineErrorAlert from "@/components/shared/inline-error-alert";

type TaskManagementPageShellProps = {
  title: string;
  description: string;
  icon: ReactNode;
  error?: string;
  filterOpen: boolean;
  onToggleFilter: () => void;
  onResetFilter: () => void;
  filterContent: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export default function TaskManagementPageShell({
  title,
  description,
  icon,
  error = "",
  filterOpen,
  onToggleFilter,
  onResetFilter,
  filterContent,
  actions,
  children,
  footer,
}: TaskManagementPageShellProps) {
  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden px-4 pb-6">
      <AdminPageHeader title={title} description={description} icon={icon} />

      {error ? <InlineErrorAlert>{error}</InlineErrorAlert> : null}

      <AdminFilterCard
        open={filterOpen}
        onToggle={onToggleFilter}
        onReset={onResetFilter}
      >
        {filterContent}
      </AdminFilterCard>

      {actions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {actions}
        </div>
      ) : null}

      {children}
      {footer}
    </section>
  );
}
