"use client";


import Link from "next/link";

import { Bell, ChevronDown, CircleArrowOutUpRightIcon, LayoutGrid } from "lucide-react";

import { DashboardUserMenu } from "@/components/dashboard";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from "@/components/ui";

import { isPrivilegedRole } from "@/constants/roles";

import { useLoadProfile } from "@/hooks/shared/profile";

import type { TopNavItem } from "@/lib/dashboard";

import { cn } from "@/lib/core";

type DashboardTopNavbarProps = {
  activeMenuId: string;
  items?: TopNavItem[];
  onShortcutClick: (menuId: string) => void;
  onMobileActionOpen?: () => void;
};

export function DashboardTopNavbar({
  activeMenuId,
  items = [],
  onShortcutClick,
  onMobileActionOpen,
}: DashboardTopNavbarProps) {
  const { profile } = useLoadProfile();
  const canAccessAdmin = isPrivilegedRole(profile.role);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center border-b border-slate-200 bg-white md:left-20">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
        <div className="justify-self-start">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMobileActionOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
              aria-label="Open actions"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <h1 className="whitespace-nowrap text-base font-semibold text-slate-800 sm:text-lg">
              CSL Management
            </h1>
          </div>
        </div>

        <div className="justify-self-center">
          <nav className="hidden lg:flex items-center gap-5">
            {items.map((item) =>
              item.children ? (
                <DropdownMenu key={item.id}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-[#0048B4]",
                        activeMenuId === item.id && "text-[#0048B4]",
                      )}
                    >
                      <span>{item.label}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="min-w-44">
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link
                          href={child.href}
                          onClick={() => onShortcutClick(item.id)}
                        >
                          {child.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={item.id}
                  href={item.href ?? "/dashboard"}
                  onClick={() => onShortcutClick(item.id)}
                  className={cn(
                    "text-sm font-medium text-slate-600 transition-colors hover:text-[#0048B4]",
                    activeMenuId === item.id && "text-[#0048B4]",
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </div>

        <div className="justify-self-end">
          <div className="flex items-center gap-2">
            {canAccessAdmin ? (
              <Button
                asChild
                size="sm"
                variant="link"
                className="hidden text-slate-700 no-underline hover:no-underline hover:text-[#0048B4] lg:inline-flex"
              >
                <Link href="/admin/home">
                  <CircleArrowOutUpRightIcon className="h-4 w-4" />
                  <span className="ml-1">Go to Admin CSL</span>
                </Link>
              </Button>
            ) : null}
            <Link
              href="/notifications"
              onClick={() => onShortcutClick("notifications")}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 hover:text-[#0048B4] md:hidden",
                activeMenuId === "notifications" && "bg-blue-50 text-[#0048B4]",
              )}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <div className="md:hidden">
              <DashboardUserMenu
                triggerClassName="h-10 w-10 justify-center rounded-lg border border-slate-200 bg-white px-0 hover:bg-slate-100"
                nameClassName="hidden"
                contentSide="bottom"
                contentAlign="end"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
