"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronDown, LayoutGrid } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardUserMenu } from "@/components/dashboard/dashboard-user-menu";
import { cn } from "@/lib/utils";
import { href } from "react-router-dom";

export type TopNavItem = {
  id: string;
  label: string;
  href?: string;
  children?: Array<{
    label: string;
    href: string;
  }>;
};

type DashboardTopNavbarProps = {
  activeMenuId: string;
  onShortcutClick: (menuId: string) => void;
  onMobileActionOpen?: () => void;
};

export const TOP_NAV_ITEMS: TopNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
  },
  { id: "schedule", label: "Lihat Jadwal", href: "/schedule" },
  {
    id: "booking-rooms",
    label: "Booking Ruangan",
    children: [
      { label: "Pengajuan Saya", href: "/booking-rooms" },
      { label: "Ajukan Booking Ruangan", href: "/booking-rooms/form" },
      // { label: "Daftar Ruangan", href: "/rooms" },
    ],
  },
  {
    id: "use-equipment",
    label: "Booking Alat",
    children: [
      { label: "Pengajuan Saya", href: "/use-equipment" },
      { label: "Ajukan Booking Alat", href: "/use-equipment/form" },
      // { label: "Daftar Alat", href: "/equipment" },
    ],
  },
  {
    id: "sample-testing",
    label: "Pengujian Sampel",
    children: [
      { label: "Pengajuan Saya", href: "/sample-testing" },
      { label: "Ajukan Pengujian", href: "/sample-testing/form" },
    ],
  },
  {
    id: "borrow-equipment",
    label: "Peminjaman Alat",
    children: [
      { label: "Pengajuan Saya", href: "/borrow-equipment" },
      { label: "Ajukan Peminjaman", href: "/borrow-equipment/form" },
      // { label: "Daftar Alat", href: "/borrow-equipment/equipment" },
    ],
  },
];

export function DashboardTopNavbar({
  activeMenuId,
  onShortcutClick,
  onMobileActionOpen,
}: DashboardTopNavbarProps) {
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
            {TOP_NAV_ITEMS.map((item) =>
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
            <DashboardUserMenu
              triggerClassName="h-10 rounded-lg bg-transparent px-2 text-slate-800 hover:bg-slate-100"
              nameClassName="hidden text-slate-800 sm:block"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
