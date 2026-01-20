"use client";

import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { API_AUTH_LOGOUT, API_AUTH_PROFILE } from "@/constants/api";

export function NavUser({ user }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [profile, setProfile] = useState(() => {
    if (typeof window === "undefined") {
      return {
        name: user?.name || "User",
        email: user?.email || "",
        canResetPassword: true,
      };
    }

    try {
      const cached = window.localStorage.getItem("profile");
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          name: parsed.name || user?.name || "User",
          email: parsed.email || user?.email || "",
          canResetPassword:
            typeof parsed.canResetPassword === "boolean"
              ? parsed.canResetPassword
              : true,
        };
      }
    } catch (error) {
      console.error("Profile cache error:", error);
    }

    return {
      name: user?.name || "User",
      email: user?.email || "",
      canResetPassword: true,
    };
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(API_AUTH_PROFILE, {
          credentials: "include",
        });
        if (!response.ok) return;
        const data = await response.json();
        const nextProfile = {
          name: data.full_name || data.username || "User",
          email: data.email || "",
          canResetPassword:
            typeof data.can_reset_password === "boolean"
              ? data.can_reset_password
              : true,
        };
        setProfile(nextProfile);
        window.localStorage.setItem("profile", JSON.stringify(nextProfile));
      } catch (error) {
        console.error("Profile fetch error:", error);
      }
    };

    loadProfile();
  }, []);

  const initials = useMemo(() => {
    const source = profile.name || profile.email || "U";
    const parts = source.trim().split(/\s+/);
    const letters = parts.slice(0, 2).map((part) => part[0]);
    return letters.join("").toUpperCase() || "U";
  }, [profile.name, profile.email]);

  const handleResetPassword = () => {
    router.push("/forgot-password");
  };

  const handleLogout = async () => {
    try {
      await fetch(API_AUTH_LOGOUT, {
        method: "GET",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      Cookies.remove("access");
      Cookies.remove("refresh");
      Cookies.remove("user");
      router.push("/login");
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
