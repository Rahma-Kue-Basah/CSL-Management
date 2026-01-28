"use client";

import * as React from "react";
import { Layers, LayoutGrid, User } from "lucide-react";

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
import { isPrivilegedRole } from "@/constants/roles";

export const NAV_DATA = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutGrid,
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Image
                  src="/logo/stem-name 2.png"
                  alt="STEM Logo"
                  width={100}
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
                  className="hidden rounded-full group-data-[collapsible=icon]:block"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
