"use client";

import * as React from "react";
import {
  Calendar,
  ClipboardList,
  LayoutGrid,
  User,
  Wrench,
} from "lucide-react";

import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { useLoadProfile } from "@/hooks/use-load-profile";
import { isPrivilegedRole, ROLE_LABELS, ROLE_VALUES } from "@/constants/roles";

export const NAV_DATA = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutGrid,
    },
    {
      title: "Jadwal Lab",
      url: "/schedule",
      icon: Calendar,
    },
    {
      title: "Booking Ruangan",
      url: "/room-booking",
      icon: ClipboardList,
      alwaysOpen: true,
      items: [
        // { title: "Ajukan Booking", url: "/room-booking/form" },
        { title: "Booking Saya", url: "/my-bookings-request" },
      ],
    },
    {
      title: "Pinjam Alat Lab",
      url: "/equipment-borrow",
      icon: Wrench,
      alwaysOpen: true,
      items: [
        // { title: "Ajukan Booking", url: "/equipment-borrow/form" },
        { title: "Peminjaman Saya", url: "/my-borrows-request" },
      ],
    },

    {
      title: "Admin",
      url: null,
      icon: User,
      items: [
        {
          title: "Inventory",
          url: null,
          items: [
            { title: "Room", url: "/room" },
            { title: "Equipment", url: "/equipment" },
          ],
        },
        {
          title: "User",
          url: null,
          items: [
            {
              title: "All",
              url: "/user",
            },
            {
              title: ROLE_LABELS[ROLE_VALUES.STUDENT],
              url: `/user?role=${ROLE_LABELS[ROLE_VALUES.STUDENT]}`,
            },
            {
              title: ROLE_LABELS[ROLE_VALUES.LECTURER],
              url: `/user?role=${ROLE_LABELS[ROLE_VALUES.LECTURER]}`,
            },
            {
              title: ROLE_LABELS[ROLE_VALUES.STAFF],
              url: `/user?role=${ROLE_LABELS[ROLE_VALUES.STAFF]}`,
            },
            {
              title: ROLE_LABELS[ROLE_VALUES.ADMIN],
              url: `/user?role=${ROLE_LABELS[ROLE_VALUES.ADMIN]}`,
            },
            {
              title: ROLE_LABELS[ROLE_VALUES.OTHER],
              url: `/user?role=${ROLE_LABELS[ROLE_VALUES.OTHER]}`,
            },
          ],
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }) {
  const { profile } = useLoadProfile();
  const isPrivileged = isPrivilegedRole(profile?.role);
  const navItems = NAV_DATA.navMain.filter(
    (item) => item.title !== "Admin" || isPrivileged,
  );

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="font-sans border-r border-sidebar-border/60"
      {...props}
    >
      <SidebarHeader className="h-16 border-b border-sidebar-border/60 flex items-center md:-mt-2 md:-mx-2 md:px-2 md:pt-2">
        <SidebarMenu className="w-full h-full px-2 ">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-full py-0 overflow-visible rounded-xl"
            >
              <Link
                href="/dashboard"
                className="flex h-full w-full items-center justify-start gap-2"
              >
                <Image
                  src="/logo/stem-name 2.png"
                  alt="STEM Logo"
                  width={120}
                  height={40}
                  style={{ width: "auto", height: "auto" }}
                  className="rounded-full group-data-[collapsible=icon]:hidden"
                />
                <Image
                  src="/logo/stem.png"
                  alt="STEM Logo"
                  width={40}
                  height={40}
                  style={{ width: "auto", height: "auto" }}
                  className="hidden rounded-full group-data-[collapsible=icon]:block mt-4"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 bg-sidebar/80 backdrop-blur-sm md:hidden">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
