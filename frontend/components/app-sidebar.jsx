"use client";

import * as React from "react";
import { Calendar, ClipboardList, Layers, LayoutGrid, User, Wrench } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
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
      title: "Peminjaman Lab",
      url: "/peminjaman-lab",
      icon: ClipboardList,
      alwaysOpen: true,
      items: [
        { title: "Ajukan Peminjaman", url: "/peminjaman-lab/ajukan" },
        { title: "List Peminjaman", url: "/peminjaman-lab" },
      ],
    },
    {
      title: "Peminjaman Alat Lab",
      url: "/peminjaman-alat",
      icon: Wrench,
      alwaysOpen: true,
      items: [
        { title: "Ajukan Peminjaman", url: "/peminjaman-alat/ajukan" },
        { title: "List Peminjaman", url: "/peminjaman-alat" },
      ],
    },
    {
      title: "Jadwal Lab",
      url: "/schedule",
      icon: Calendar,
    },
    {
      title: "Inventory",
      url: null,
      icon: Layers,
      alwaysOpen: true,
      items: [
        { title: "Room", url: "/rooms" },
        { title: "Equipment", url: "/equipments" },
      ],
    },
    {
      title: "Admin",
      url: null,
      icon: User,
      items: [
        {
          title: "User",
          url: "/user",
          items: [
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
      className="font-sans"
      {...props}
    >
      <SidebarHeader className="border-b border-sidebar-border/60 bg-[linear-gradient(135deg,rgba(227,6,20,0.10),rgba(227,6,20,0)_70%)]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-16 py-3 overflow-visible rounded-xl">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Image
                  src="/logo/stem-name 2.png"
                  alt="STEM Logo"
                  width={140}
                  height={50}
                  style={{ width: "auto", height: "auto" }}
                  className="rounded-full group-data-[collapsible=icon]:hidden"
                />
                <Image
                  src="/logo/stem.png"
                  alt="STEM Logo"
                  width={40}
                  height={40}
                  style={{ width: "auto", height: "auto" }}
                  className="hidden rounded-full group-data-[collapsible=icon]:block"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 bg-sidebar/80 backdrop-blur-sm">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
