"use client";

import { CircleArrowOutUpLeft, CircleArrowOutUpRight, LogOut, UserRound } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  useLoadProfile,
  type ProfileUserInput,
} from "@/hooks/profile/use-load-profile";
import { useLogout } from "@/hooks/auth/use-logout";
import Link from "next/link";

type NavUserProps = {
  user?: ProfileUserInput | null;
};

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const { profile, initials } = useLoadProfile(user);
  const { handleLogout } = useLogout();

  return (
    <SidebarMenu className="w-full">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-10 rounded-xl text-zinc-100 data-[state=open]:text-zinc-100 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-zinc-700 text-zinc-100">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium text-sidebar-foreground/70">
                  {profile.name}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-68 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-xl"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-[15px]">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-slate-700 text-slate-100">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-[14px] leading-tight">
                  <span className="truncate font-medium">{profile.name}</span>
                  <span className="truncate text-[12px] text-slate-300">
                    {profile.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem className="cursor-pointer text-slate-100 hover:bg-slate-800 focus:bg-slate-800 focus:text-slate-100 text-sm">
              <Link href="/dashboard" className="flex items-center w-full">
                <CircleArrowOutUpRight className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />

            <DropdownMenuItem className="cursor-pointer text-slate-100 hover:bg-slate-800 focus:bg-slate-800 focus:text-slate-100 text-sm">
              <Link href="/admin/my-profile" className="flex items-center w-full">
                <UserRound className="mr-2 h-4 w-4" />
                Profil Saya
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer text-slate-100 hover:bg-slate-800 focus:bg-slate-800 focus:text-slate-100"
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
