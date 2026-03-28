"use client";

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
import {
  APPROVAL_ACCESS_ROLES,
  CATALOG_ACCESS_ROLES,
  REQUESTER_ACCESS_ROLES,
  SAMPLE_TESTING_REQUESTER_ACCESS_ROLES,
} from "@/lib/dashboard-access";

export type TopNavItem = {
  id: string;
  label: string;
  href?: string;
  children?: Array<{
    id?: string;
    label: string;
    href: string;
    allowedRoles?: readonly string[];
  }>;
};

type DashboardTopNavbarProps = {
  activeMenuId: string;
  items?: TopNavItem[];
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
      {
        label: "Pengajuan Saya",
        href: "/booking-rooms",
        allowedRoles: REQUESTER_ACCESS_ROLES,
      },
      {
        label: "Ajukan Booking Ruangan",
        href: "/booking-rooms/form",
        allowedRoles: REQUESTER_ACCESS_ROLES,
      },
      {
        id: "all-requests",
        label: "Approval Booking Ruangan",
        href: "/booking-rooms/approval",
        allowedRoles: APPROVAL_ACCESS_ROLES,
      },
      {
        label: "Ruangan yang Bisa di-Booking",
        href: "/rooms",
        allowedRoles: CATALOG_ACCESS_ROLES,
      },
    ],
  },
  {
    id: "use-equipment",
    label: "Penggunaan Alat",
    children: [
      {
        label: "Pengajuan Saya",
        href: "/use-equipment",
        allowedRoles: REQUESTER_ACCESS_ROLES,
      },
      {
        label: "Ajukan Penggunaan Alat",
        href: "/use-equipment/form",
        allowedRoles: REQUESTER_ACCESS_ROLES,
      },
      {
        id: "all-requests",
        label: "Approval Penggunaan Alat",
        href: "/use-equipment/approval",
        allowedRoles: APPROVAL_ACCESS_ROLES,
      },
      {
        label: "Peralatan yang Bisa Dibooking",
        href: "/equipment",
        allowedRoles: CATALOG_ACCESS_ROLES,
      },
    ],
  },
  {
    id: "sample-testing",
    label: "Pengujian Sampel",
    children: [
      {
        label: "Pengajuan Saya",
        href: "/sample-testing",
        allowedRoles: SAMPLE_TESTING_REQUESTER_ACCESS_ROLES,
      },
      {
        label: "Ajukan Pengujian",
        href: "/sample-testing/form",
        allowedRoles: SAMPLE_TESTING_REQUESTER_ACCESS_ROLES,
      },
      {
        id: "all-requests",
        label: "Approval Pengujian Sampel",
        href: "/sample-testing/approval",
        allowedRoles: APPROVAL_ACCESS_ROLES,
      },
    ],
  },
  {
    id: "borrow-equipment",
    label: "Peminjaman Alat",
    children: [
      {
        label: "Pengajuan Saya",
        href: "/borrow-equipment",
        allowedRoles: REQUESTER_ACCESS_ROLES,
      },
      {
        label: "Ajukan Peminjaman",
        href: "/borrow-equipment/form",
        allowedRoles: REQUESTER_ACCESS_ROLES,
      },
      {
        id: "all-requests",
        label: "Approval Peminjaman Alat",
        href: "/borrow-equipment/approval",
        allowedRoles: APPROVAL_ACCESS_ROLES,
      },
      {
        label: "Alat yang Bisa Dipinjam",
        href: "/borrow-equipment/equipment",
        allowedRoles: CATALOG_ACCESS_ROLES,
      },
    ],
  },
];

export function DashboardTopNavbar({
  activeMenuId,
  items = TOP_NAV_ITEMS,
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
