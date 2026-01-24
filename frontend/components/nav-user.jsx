"use client";

import { ChevronsUpDown, LogOut, Settings, UserRound, Bell } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useLoadProfile } from "@/hooks/use-load-profile";
import { useLogout } from "@/hooks/use-logout";
import { ProfileDrawer } from "@/components/profile-drawer";
import { NotificationDrawer } from "@/components/notification-drawer";

export function NavUser({ user }) {
  const { isMobile } = useSidebar();
  const { profile, initials } = useLoadProfile(user);
  const { handleLogout } = useLogout();

  const handleResetPassword = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/forgot-password";
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{profile.name}</span>
                {/* <span className="truncate text-xs">{profile.email}</span> */}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{profile.name}</span>
                  <span className="truncate text-xs">{profile.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ProfileDrawer user={user}>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                }}
              >
                <UserRound />
                View Profile
              </DropdownMenuItem>
            </ProfileDrawer>
            <NotificationDrawer>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                }}
              >
                <Bell />
                Notifications
              </DropdownMenuItem>
            </NotificationDrawer>
            {profile.canResetPassword && (
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    handleResetPassword();
                  }}
                >
                  <Settings />
                  Reset Password
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                handleLogout();
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
